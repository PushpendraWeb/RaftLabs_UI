// const API_BASE_URL = 'http://localhost:2000';
const API_BASE_URL = 'https://raftlabsapim.vercel.app';

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with status ${res.status}`);
  }

  try {
    return await res.json();
  } catch {
    return null;
  }
}

// User APIs

export async function getUsers() {
  return request('/api/user/all');
}

export async function createUser({ name, phone, address, createdBy }) {
  return request('/api/user/create', {
    method: 'POST',
    body: JSON.stringify({
      name,
      phone,
      address,
      status: true,
      createdBy
    })
  });
}

export async function updateUser({ id, name, phone, address, status, updatedBy }) {
  return request('/api/user/update', {
    method: 'PUT',
    body: JSON.stringify({
      id,
      name,
      phone,
      address,
      status,
      updatedBy
    })
  });
}

export async function deleteUser(id, deletedBy) {
  return request(`/api/user/delete/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({
      DeletedBy: deletedBy
    })
  });
}

// Items

export async function getItems() {
  return request('/api/items/all');
}

export async function createItem({
  name,
  description,
  price,
  image,
  status = true,
  createdBy
}) {
  return request('/api/items/create', {
    method: 'POST',
    body: JSON.stringify({
      name,
      description,
      price,
      image,
      status,
      createdBy
    })
  });
}

export async function updateItem({
  id,
  name,
  description,
  price,
  image,
  status,
  updatedBy
}) {
  return request('/api/items/update', {
    method: 'PUT',
    body: JSON.stringify({
      id,
      name,
      description,
      price,
      image,
      status,
      updatedBy
    })
  });
}

export async function deleteItem(id, deletedBy) {
  return request(`/api/items/delete/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({
      DeletedBy: deletedBy
    })
  });
}

// Cart

export async function createCart({ userId, items }) {
  return request('/api/cart/create', {
    method: 'POST',
    body: JSON.stringify({
      user_id: userId,
      food_items: items.map((item) => ({
        food_items_id: item.food_items_id,
        quantity: item.quantity
      })),
      status: true,
      createdBy: userId
    })
  });
}

export async function updateCart({ cartId, userId, items }) {
  return request('/api/cart/update', {
    method: 'PUT',
    body: JSON.stringify({
      id: cartId,
      user_id: userId,
      food_items: items.map((item) => ({
        food_items_id: item.food_items_id,
        quantity: item.quantity
      })),
      status: true,
      updatedBy: userId
    })
  });
}

export async function getCarts() {
  return request('/api/cart/all');
}

export async function getCartById(id) {
  return request(`/api/cart/getbyid/${id}`);
}

export async function updateCartQuantity({ cartId, food_items_id, quantity }) {
  return request('/api/cart/updateQuantity', {
    method: 'PUT',
    body: JSON.stringify({
      cart_id: cartId,
      food_items_id,
      quantity
    })
  });
}

export async function removeItemFromCart({ cartId, food_items_id }) {
  return request('/api/cart/RemoveItemsinCart', {
    method: 'PUT',
    body: JSON.stringify({
      cart_id: cartId,
      food_items_id
    })
  });
}

export async function deleteCart(id, deletedBy) {
  return request(`/api/cart/delete/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({
      DeletedBy: deletedBy
    })
  });
}

export async function createOrder({ cartId, userId }) {
  return request('/api/orders/create', {
    method: 'POST',
    body: JSON.stringify({
      cart_id: cartId,
      user_id: userId,
      createdBy: userId
    })
  });
}

export async function getOrderById(orderId) {
  return request(`/api/orders/getbyid/${orderId}`);
}

export async function updateOrderStatus(orderId, status, userId) {
  return request('/api/orders/updateStatus', {
    method: 'PUT',
    body: JSON.stringify({
      id: orderId,
      order_status: status,
      updatedBy: userId
    })
  });
}

export async function getOrders() {
  return request('/api/orders/all');
}

export async function updateOrder({
  id,
  order_status,
  status,
  updatedBy
}) {
  return request('/api/orders/update', {
    method: 'PUT',
    body: JSON.stringify({
      id,
      order_status,
      status,
      updatedBy
    })
  });
}

export async function deleteOrder(id, deletedBy) {
  return request(`/api/orders/delete/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({
      DeletedBy: deletedBy
    })
  });
}

