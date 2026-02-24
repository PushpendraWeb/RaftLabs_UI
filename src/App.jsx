import React, { useEffect, useMemo, useState } from 'react';
import { NavLink, Route, Routes, Navigate } from 'react-router-dom';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getItems,
  createItem,
  updateItem,
  deleteItem,
  getCarts,
  getOrders,
  createCart,
  updateCart,
  createOrder,
  getOrderById,
  updateOrderStatus
} from './apiClient';

const getUserId = (user) =>
  user?.user_id ?? user?.id ?? user?._id ?? null;

const getItemId = (item) =>
  item?.food_items_id ?? item?.id ?? item?._id ?? null;

const ORDER_STATUSES = [
  'Pending',
  'Order Received',
  'Preparing',
  'Out for Delivery',
  'Delivered'
];

function App() {
  const [userId, setUserId] = useState('');
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [editUser, setEditUser] = useState({
    name: '',
    phone: '',
    address: '',
    status: true
  });
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [editItem, setEditItem] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    status: true
  });

  const [cartId, setCartId] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [cartSaving, setCartSaving] = useState(false);

  const [orderId, setOrderId] = useState(null);
  const [orderInfo, setOrderInfo] = useState(null);
  const [orderError, setOrderError] = useState('');
  const [simulateStatus, setSimulateStatus] = useState(true);

  const [pollingIntervalMs] = useState(3000);
  const [ordersCount, setOrdersCount] = useState(0);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [cartInitializing, setCartInitializing] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      // Users
      setUsersLoading(true);
      setUsersError('');
      try {
        const data = await getUsers();
        const list = data?.data || data || [];
        const safeList = (Array.isArray(list) ? list : [])
          .map((u) => ({
            ...u,
            user_id: getUserId(u)
          }))
          .filter((u) => u.user_id != null && u.status !== false);
        setUsers(safeList);
        if (!userId && safeList.length > 0) {
          setUserId(String(getUserId(safeList[0])));
        }
      } catch (err) {
        setUsersError(err.message || 'Failed to load users');
      } finally {
        setUsersLoading(false);
      }

      // Items
      setItemsLoading(true);
      setItemsError('');
      try {
        const itemsData = await getItems();
        const itemsList = itemsData?.data || itemsData || [];
        const safeItems = (Array.isArray(itemsList) ? itemsList : [])
          .map((it) => ({
            ...it,
            food_items_id: getItemId(it)
          }))
          .filter((it) => it.food_items_id != null && it.status !== false);
        setItems(safeItems);
      } catch (err) {
        setItemsError(err.message || 'Failed to load menu items');
      } finally {
        setItemsLoading(false);
      }

      // Orders (for dashboard + list)
      try {
        setOrdersLoading(true);
        setOrdersError('');
        const ordersData = await getOrders();
        const ordersList = ordersData?.data || ordersData || [];
        const safeOrders = Array.isArray(ordersList) ? ordersList : [];
        setOrders(safeOrders);
        setOrdersCount(safeOrders.length);
      } catch (err) {
        setOrdersError(err.message || 'Failed to load orders');
        setOrdersCount(0);
      } finally {
        setOrdersLoading(false);
      }

    };

    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const selected = users.find(
      (u) => String(getUserId(u)) === String(userId)
    );
    if (selected) {
      setEditUser({
        name: selected.name || '',
        phone: selected.phone || '',
        address: selected.address || '',
        status: selected.status !== false
      });
    } else {
      setEditUser({
        name: '',
        phone: '',
        address: '',
        status: true
      });
    }
  }, [userId, users]);

  // When page loads (and user + items are known), hydrate cart from backend
  useEffect(() => {
    const hydrateCart = async () => {
      if (!userId) return;
      if (itemsLoading) return;

      setCartInitializing(true);
      try {
        const cartsRes = await getCarts();
        const list = cartsRes?.data || cartsRes || [];
        const allCarts = Array.isArray(list) ? list : [];
        const userCarts = allCarts.filter(
          (c) =>
            Number(c.user_id) === Number(userId) &&
            c.status !== false
        );
        if (userCarts.length === 0) {
          setCartId(null);
          setCartItems([]);
          return;
        }

        const latest = userCarts[userCarts.length - 1];
        const latestId =
          latest.cart_id ?? latest.id ?? latest._id ?? null;
        if (!latestId) {
          setCartId(null);
          setCartItems([]);
          return;
        }

        setCartId(latestId);
        const mappedItems = Array.isArray(latest.food_items)
          ? latest.food_items.map((fi) => {
              const src = items.find(
                (it) =>
                  Number(getItemId(it)) ===
                  Number(fi.food_items_id)
              );
              return {
                food_items_id: fi.food_items_id,
                quantity: fi.quantity,
                name: src?.name || `Item #${fi.food_items_id}`,
                price: src?.price || 0
              };
            })
          : [];
        setCartItems(mappedItems);
      } catch (err) {
        console.error('Failed to hydrate cart', err);
      } finally {
        setCartInitializing(false);
      }
    };

    hydrateCart();
  }, [userId, items, itemsLoading]);

  useEffect(() => {
    const selected = items.find(
      (it) => String(getItemId(it)) === String(selectedItemId)
    );
    if (selected) {
      setEditItem({
        name: selected.name || '',
        description: selected.description || '',
        price: selected.price != null ? String(selected.price) : '',
        image: selected.image || '',
        status: selected.status !== false
      });
    } else {
      setEditItem({
        name: '',
        description: '',
        price: '',
        image: '',
        status: true
      });
    }
  }, [selectedItemId, items]);

  const cartTotal = useMemo(
    () =>
      cartItems.reduce(
        (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
        0
      ),
    [cartItems]
  );

  const handleAddToCart = async (item) => {
    if (!userId) {
      alert('Please set a User ID before adding items to cart.');
      return;
    }

    setCartSaving(true);
    try {
      let nextCartItems = [...cartItems];
      const existing = nextCartItems.find(
        (ci) => ci.food_items_id === item.food_items_id
      );

      if (existing) {
        existing.quantity += 1;
      } else {
        nextCartItems.push({
          food_items_id: item.food_items_id,
          name: item.name,
          price: item.price,
          quantity: 1
        });
      }

      setCartItems(nextCartItems);

      if (!cartId) {
        const created = await createCart({
          userId: Number(userId),
          items: nextCartItems
        });
        const createdData = created?.data || created?.cart || created;
        const newId =
          createdData?.cart_id ?? createdData?.id ?? createdData?._id;
        if (newId) {
          setCartId(newId);
        }
      } else {
        await updateCart({
          cartId,
          userId: Number(userId),
          items: nextCartItems
        });
      }
    } catch (err) {
      alert(err.message || 'Failed to update cart');
    } finally {
      setCartSaving(false);
    }
  };

  const handleChangeQuantity = async (food_items_id, delta) => {
    if (!cartId || !userId) return;

    setCartSaving(true);
    try {
      let nextCartItems = cartItems
        .map((item) =>
          item.food_items_id === food_items_id
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0);

      setCartItems(nextCartItems);

      await updateCart({
        cartId,
        userId: Number(userId),
        items: nextCartItems
      });
    } catch (err) {
      alert(err.message || 'Failed to update cart');
    } finally {
      setCartSaving(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!userId || !cartId || cartItems.length === 0) {
      alert('User, cart and items are required to place an order.');
      return;
    }

    setOrderError('');
    try {
      const created = await createOrder({
        cartId,
        userId: Number(userId)
      });
      const createdData = created?.data || created?.order || created;
      const newOrderId =
        createdData?.order_id ?? createdData?.id ?? createdData?._id;
      if (newOrderId) {
        // Order placed successfully – clear current order and cart state
        setOrderId(null);
        setOrderInfo(null);
        setCartId(null);
        setCartItems([]);
      } else {
        setOrderError('Order created but ID was not returned by API.');
      }
    } catch (err) {
      setOrderError(err.message || 'Failed to place order');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!editUser.name || !editUser.phone) {
      alert('Name and phone are required.');
      return;
    }
    try {
      if (userId) {
        // Update existing user
        const idNum = Number(userId);
        const updated = await updateUser({
          id: idNum,
          name: editUser.name,
          phone: editUser.phone,
          address: editUser.address,
          status: editUser.status,
          updatedBy: idNum
        });
        const updatedData = updated?.data || updated?.user || updated;
        const updatedId = getUserId(updatedData) ?? Number(userId);
        const merged = { ...updatedData, user_id: updatedId };
        const nextUsers = users.map((u) =>
          String(getUserId(u)) === String(userId) ? { ...u, ...merged } : u
        );
        setUsers(nextUsers.filter((u) => u.status !== false));
      } else {
        // Create new user
        const created = await createUser({
          name: editUser.name,
          phone: editUser.phone,
          address: editUser.address,
          createdBy: 1
        });
        const createdData = created?.data || created?.user || created;
        const createdId =
          createdData?.user_id ?? createdData?.id ?? createdData?._id;

        const normalized = createdId
          ? { ...createdData, user_id: createdId }
          : createdData;
        const updatedUsers = [...users, normalized].filter(
          (u) => u && getUserId(u) != null && u.status !== false
        );
        setUsers(updatedUsers);
        if (createdId) {
          setUserId(String(createdId));
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to save user');
    }
  };

  const handleDeleteUser = async () => {
    if (!userId) {
      alert('Select a user to delete.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    try {
      const idNum = Number(userId);
      await deleteUser(idNum, idNum);
      const remaining = users.filter(
        (u) => String(getUserId(u)) !== String(userId)
      );
      setUsers(remaining);
      setUserId(remaining[0] ? String(getUserId(remaining[0])) : '');
      if (!remaining[0]) {
        setEditUser({
          name: '',
          phone: '',
          address: '',
          status: true
        });
      }
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!userId) {
      alert('Please select a user first. Items use that user as createdBy/updatedBy.');
      return;
    }
    if (!editItem.name || !editItem.price) {
      alert('Name and price are required.');
      return;
    }
    const numericPrice = Number(editItem.price);
    if (Number.isNaN(numericPrice) || numericPrice < 0) {
      alert('Price must be a valid number.');
      return;
    }
    const actorId = Number(userId);
    try {
      if (selectedItemId) {
        const idNum = Number(selectedItemId);
        const updated = await updateItem({
          id: idNum,
          name: editItem.name,
          description: editItem.description,
          price: numericPrice,
          image: editItem.image,
          status: editItem.status,
          updatedBy: actorId
        });
        const updatedData = updated?.data || updated?.item || updated;
        const updatedId = getItemId(updatedData) ?? idNum;
        const merged = { ...updatedData, food_items_id: updatedId };
        const nextItems = items.map((it) =>
          String(getItemId(it)) === String(selectedItemId)
            ? { ...it, ...merged }
            : it
        );
        setItems(nextItems.filter((it) => it.status !== false));
      } else {
        const created = await createItem({
          name: editItem.name,
          description: editItem.description,
          price: numericPrice,
          image: editItem.image,
          status: true,
          createdBy: actorId
        });
        const createdData = created?.data || created?.item || created;
        const createdId =
          createdData?.food_items_id ??
          createdData?.id ??
          createdData?._id;

        const normalized = createdId
          ? { ...createdData, food_items_id: createdId }
          : createdData;
        const updatedItems = [...items, normalized].filter(
          (it) => it && getItemId(it) != null && it.status !== false
        );
        setItems(updatedItems);
        // After creating a new item, clear the form and reset selection
        setSelectedItemId('');
        setEditItem({
          name: '',
          description: '',
          price: '',
          image: '',
          status: true
        });
      }
    } catch (err) {
      alert(err.message || 'Failed to save item');
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItemId) {
      alert('Select an item to delete.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }
    try {
      const idNum = Number(selectedItemId);
      const actorId = userId ? Number(userId) : 1;
      await deleteItem(idNum, actorId);
      const remaining = items.filter(
        (it) => String(getItemId(it)) !== String(selectedItemId)
      );
      setItems(remaining);
      setSelectedItemId(remaining[0] ? String(getItemId(remaining[0])) : '');
      if (!remaining[0]) {
        setEditItem({
          name: '',
          description: '',
          price: '',
          image: '',
          status: true
        });
      }
    } catch (err) {
      alert(err.message || 'Failed to delete item');
    }
  };

  useEffect(() => {
    if (!orderId) return;

    let cancelled = false;

    const fetchOrder = async () => {
      try {
        const data = await getOrderById(orderId);
        const orderData = data?.data || data?.order || data;
        if (!cancelled) {
          setOrderInfo(orderData);
        }
      } catch (err) {
        if (!cancelled) {
          setOrderError(err.message || 'Failed to fetch order');
        }
      }
    };

    fetchOrder();
    const intervalId = setInterval(fetchOrder, pollingIntervalMs);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [orderId, pollingIntervalMs]);

  useEffect(() => {
    if (!orderId || !simulateStatus || !userId) return;

    let currentIndex = 0;
    let stopped = false;

    const tick = async () => {
      if (stopped) return;
      currentIndex += 1;
      if (currentIndex >= ORDER_STATUSES.length) return;

      const nextStatus = ORDER_STATUSES[currentIndex];

      try {
        await updateOrderStatus(orderId, nextStatus, Number(userId));
      } catch (err) {
        console.error('Failed to update order status', err);
      }

      if (currentIndex < ORDER_STATUSES.length - 1 && !stopped) {
        setTimeout(tick, 4000);
      }
    };

    setTimeout(tick, 4000);

    return () => {
      stopped = true;
    };
  }, [orderId, simulateStatus, userId]);

  return (
    <div className="app">
      <header className="header">
        <h1>RaftLabs Food Ordering</h1>
        <p className="subtitle">
       Track orders and manage users.
        </p>
        <nav className="nav-tabs">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? 'nav-tab active' : 'nav-tab'
            }
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/users"
            className={({ isActive }) =>
              isActive ? 'nav-tab active' : 'nav-tab'
            }
          >
            User
          </NavLink>
          <NavLink
            to="/items"
            className={({ isActive }) =>
              isActive ? 'nav-tab active' : 'nav-tab'
            }
          >
            Items
          </NavLink>
          <NavLink
            to="/cart"
            className={({ isActive }) =>
              isActive ? 'nav-tab active' : 'nav-tab'
            }
          >
            Cart
          </NavLink>
          <NavLink
            to="/orders"
            className={({ isActive }) =>
              isActive ? 'nav-tab active' : 'nav-tab'
            }
          >
            Orders
          </NavLink>
        </nav>
      </header>

      <Routes>
        <Route
          path="/"
          element={
            <main className="layout">
              <section className="panel full">
                <h2>Dashboard</h2>
                <p className="help-text">
                  Quick overview of users, items and orders.
                </p>
                <div className="dashboard-cards">
                  <div className="dashboard-card">
                    <span className="dashboard-label">Users</span>
                    <span className="dashboard-value">{users.length}</span>
                  </div>
                  <div className="dashboard-card">
                    <span className="dashboard-label">Items</span>
                    <span className="dashboard-value">{items.length}</span>
                  </div>
                  <div className="dashboard-card">
                    <span className="dashboard-label">Orders</span>
                    <span className="dashboard-value">{ordersCount}</span>
                  </div>
                </div>
              </section>
            </main>
          }
        />
        <Route
          path="/users"
          element={
            <main className="layout">
              <section className="panel full">
          <h2>User</h2>
          <p className="help-text">
            Select an existing user or create a new one.
          </p>
          <div className="field">
            <label>Existing users</label>
            {usersLoading && <p>Loading users...</p>}
            {usersError && <p className="error">{usersError}</p>}
            {!usersLoading && users.length > 0 && (
              <div className="table-wrapper">
                <table className="table users-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Phone</th>
                      <th>Address</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const id = getUserId(u);
                      return (
                        <tr
                          key={id}
                          className={
                            String(id) === String(userId) ? 'row-selected' : ''
                          }
                        >
                          <td>#{id}</td>
                          <td>{u.name}</td>
                          <td>{u.phone}</td>
                          <td>{u.address}</td>
                          <td>
                            <button
                              type="button"
                              className="btn small"
                              onClick={() => setUserId(String(id))}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn small"
                              onClick={() => {
                                setUserId(String(id));
                                handleDeleteUser();
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {!usersLoading && users.length === 0 && (
              <p className="hint">No users yet. Create one below.</p>
            )}
          </div>

          <form className="field" onSubmit={handleCreateUser}>
            <label>{userId ? 'Edit selected user' : 'Create user'}</label>
              <input
                type="text"
                placeholder="Name"
                value={editUser.name}
                onChange={(e) =>
                  setEditUser((prev) => ({ ...prev, name: e.target.value }))
                }
              />
              <input
                type="tel"
                placeholder="Phone"
                value={editUser.phone}
                onChange={(e) =>
                  setEditUser((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
              <input
                type="text"
                placeholder="Address"
                value={editUser.address}
                onChange={(e) =>
                  setEditUser((prev) => ({ ...prev, address: e.target.value }))
                }
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <button type="submit" className="btn primary">
                  {userId ? 'Update user' : 'Create user'}
                </button>
                {userId && (
                  <>
                    <button
                      type="button"
                      className="btn"
                      onClick={handleDeleteUser}
                    >
                      Delete user
                    </button>
                    <button
                      type="button"
                      className="btn"
                      onClick={() => {
                        setUserId('');
                        setEditUser({
                          name: '',
                          phone: '',
                          address: '',
                          status: true
                        });
                      }}
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </form>

          <p className="hint">
            Selected user ID will be used as <code>user_id</code>,{' '}
            <code>createdBy</code> and <code>updatedBy</code> in cart and order
            requests.
          </p>
              </section>
            </main>
          }
        />
        <Route
          path="/items"
          element={
            <main className="layout">
              <section className="panel full">
          <h2>Items</h2>
          <p className="help-text">
            Manage menu items and add them to the cart.
          </p>
          {itemsLoading && <p>Loading items...</p>}
          {itemsError && <p className="error">{itemsError}</p>}
          {!itemsLoading && items.length > 0 && (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Price</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const id = getItemId(item);
                    return (
                      <tr
                        key={id}
                        className={
                          String(id) === String(selectedItemId)
                            ? 'row-selected'
                            : ''
                        }
                      >
                        <td>#{id}</td>
                        <td>
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="table-img"
                            />
                          ) : (
                            <span className="hint">No image</span>
                          )}
                        </td>
                        <td>{item.name}</td>
                        <td>{item.description}</td>
                        <td>₹{item.price}</td>
                        <td>
                          <button
                            type="button"
                            className="btn small"
                            onClick={() => setSelectedItemId(String(id))}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn small"
                            onClick={() => {
                              setSelectedItemId(String(id));
                              handleDeleteItem();
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {!itemsLoading && items.length === 0 && (
            <p className="hint">No items yet. Create one below.</p>
          )}

          <form className="field" onSubmit={handleSaveItem}>
            <label>{selectedItemId ? 'Edit selected item' : 'Create item'}</label>
            <input
              type="text"
              placeholder="Name"
              value={editItem.name}
              onChange={(e) =>
                setEditItem((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <input
              type="text"
              placeholder="Description"
              value={editItem.description}
              onChange={(e) =>
                setEditItem((prev) => ({
                  ...prev,
                  description: e.target.value
                }))
              }
            />
            <input
              type="number"
              placeholder="Price"
              value={editItem.price}
              onChange={(e) =>
                setEditItem((prev) => ({ ...prev, price: e.target.value }))
              }
            />
            <input
              type="text"
              placeholder="Image URL (optional)"
              value={editItem.image}
              onChange={(e) =>
                setEditItem((prev) => ({ ...prev, image: e.target.value }))
              }
            />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button type="submit" className="btn primary">
                {selectedItemId ? 'Update item' : 'Create item'}
              </button>
              {selectedItemId && (
                <>
                  <button
                    type="button"
                    className="btn"
                    onClick={handleDeleteItem}
                  >
                    Delete item
                  </button>
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setSelectedItemId('');
                      setEditItem({
                        name: '',
                        description: '',
                        price: '',
                        image: '',
                        status: true
                      });
                    }}
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </form>
              </section>
            </main>
          }
        />
        <Route
          path="/cart"
          element={
            <main className="layout">
              <section className="panel full">
          <h2>Items</h2>
          {!itemsLoading && !itemsError && items.length > 0 && (
            <div className="cart-menu-grid">
              {items.map((item) => (
                <article key={item.food_items_id} className="menu-card">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="menu-image"
                    />
                  )}
                  <div className="menu-body">
                    <h3>{item.name}</h3>
                    {item.description && (
                      <p className="description">{item.description}</p>
                    )}
                    <p className="price">₹{item.price}</p>
                    <button
                      className="btn primary"
                      onClick={() => handleAddToCart(item)}
                      disabled={cartSaving || !userId}
                    >
                      Add to cart
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
          {!itemsLoading && !itemsError && items.length === 0 && (
            <p className="hint">No items available yet. Create items on the Items page.</p>
          )}
          <div className="cart-box">
            <h3>Your Cart</h3>
            {cartInitializing ? (
              <p>Loading cart...</p>
            ) : cartItems.length === 0 ? (
              <p>Your cart is empty.</p>
            ) : (
              <>
                <ul className="cart-list">
                  {cartItems.map((item) => (
                    <li key={item.food_items_id} className="cart-item">
                      <div>
                        <div className="cart-name">{item.name}</div>
                        <div className="cart-meta">
                          ₹{item.price} × {item.quantity}
                        </div>
                      </div>
                      <div className="cart-actions">
                        <button
                          className="btn small"
                          onClick={() =>
                            handleChangeQuantity(item.food_items_id, -1)
                          }
                          disabled={cartSaving}
                        >
                          −
                        </button>
                        <button
                          className="btn small"
                          onClick={() =>
                            handleChangeQuantity(item.food_items_id, 1)
                          }
                          disabled={cartSaving}
                        >
                          +
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="cart-footer">
                  <span className="cart-total">Total: ₹{cartTotal}</span>
                  <button
                    className="btn primary"
                    onClick={handlePlaceOrder}
                    disabled={cartSaving || !userId || !cartId}
                  >
                    Place Order
                  </button>
                </div>
                {!cartId && (
                  <p className="hint">
                    Cart will be created on the backend on first add.
                  </p>
                )}
              </>
            )}
          </div>
              </section>
            </main>
          }
        />
        <Route
          path="/orders"
          element={
            <main className="layout">
              <section className="panel full">
          <h2>Orders</h2>

          <h3>Current order status</h3>
          {!orderId && <p>No active order yet. Place an order to track it.</p>}
          {orderId && (
            <>
              <p>
                <strong>Order ID:</strong> {orderId}
              </p>
              {orderInfo && (
                <>
                  <p>
                    <strong>Status:</strong> {orderInfo.order_status}
                  </p>
                  <p>
                    <strong>Total:</strong> ₹{orderInfo.total}
                  </p>
                </>
              )}
              {orderError && <p className="error">{orderError}</p>}

              <label className="toggle">
                <input
                  type="checkbox"
                  checked={simulateStatus}
                  onChange={(e) => setSimulateStatus(e.target.checked)}
                />
                <span>
                  Simulate real-time status updates (automatically step through
                  order statuses using the API)
                </span>
              </label>
              <p className="hint">
                When enabled, the UI calls <code>/api/orders/updateStatus</code>{' '}
                every few seconds to move the order from{' '}
                <em>Pending → Delivered</em>, while polling{' '}
                <code>/api/orders/getbyid/:id</code> for real-time updates.
              </p>
            </>
          )}

          <div className="field" style={{ marginTop: '1.25rem' }}>
            <label>All orders</label>
            {ordersLoading && <p>Loading orders...</p>}
            {ordersError && <p className="error">{ordersError}</p>}
            {!ordersLoading && orders.length > 0 && (
              <div className="orders-list">
                {orders.map((order) => {
                  const id =
                    order.order_id ?? order.id ?? order._id;
                  const itemsList = Array.isArray(order.food_items)
                    ? order.food_items
                    : [];
                  return (
                    <article key={id} className="order-card">
                      <header className="order-card-header">
                        <div>
                          <div className="order-id">Order #{id}</div>
                          <div className="order-meta">
                            User: {order.user_id}{' '}
                            {order.createdAt && (
                              <span>• {new Date(order.createdAt).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                        <div className="order-status">
                          <span>{order.order_status}</span>
                          <span className="order-total">₹{order.total}</span>
                        </div>
                      </header>
                      {itemsList.length === 0 ? (
                        <p className="hint">No items in this order.</p>
                      ) : (
                        <ul className="order-items">
                          {itemsList.map((fi) => {
                            const src = items.find(
                              (it) =>
                                Number(getItemId(it)) ===
                                Number(fi.food_items_id)
                            );
                            const name =
                              src?.name || `Item #${fi.food_items_id}`;
                            const price = src?.price ?? 0;
                            const image = src?.image;
                            return (
                              <li
                                key={`${id}-${fi.food_items_id}`}
                                className="order-item"
                              >
                                {image && (
                                  <img
                                    src={image}
                                    alt={name}
                                    className="order-item-img"
                                  />
                                )}
                                <div className="order-item-body">
                                  <div className="order-item-name">{name}</div>
                                  <div className="order-item-meta">
                                    ₹{price} × {fi.quantity}
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
            {!ordersLoading && !ordersError && orders.length === 0 && (
              <p className="hint">No orders found.</p>
            )}
          </div>
              </section>
            </main>
          }
        />
        <Route
          path="*"
          element={
            <Navigate to="/" replace />
          }
        />
      </Routes>
    </div>
  );
}

export default App;

