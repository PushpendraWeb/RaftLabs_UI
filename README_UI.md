# RaftLabs Food Ordering – Frontend (UI)

A React single-page application for the **RaftLabs Food Ordering** system. Users can manage users and menu items, add items to the cart, place orders, and view all orders with items, status, and totals.

---

## Technology Stack

| Category        | Technology |
|----------------|------------|
| **Framework**  | React 18 |
| **Build tool** | Vite 6 |
| **Compiler**   | SWC (via `@vitejs/plugin-react-swc`) |
| **Routing**    | React Router DOM 7 |
| **Language**   | JavaScript (JSX) |
| **Styling**    | Plain CSS (no preprocessor) |
| **API**        | REST (fetch), JSON |

### Why these choices

- **Vite**: Fast dev server and builds, native ESM.
- **React 18**: Component-based UI with hooks.
- **React Router DOM**: Client-side routes (Dashboard, Users, Items, Cart, Orders).
- **SWC**: Faster JSX/TS compilation than Babel.

---

## Project Structure

```
RaftLabs_UI/
├── index.html              # Entry HTML, mounts React at #root
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite config (React plugin, port 5173)
├── README_UI.md            # This file
│
└── src/
    ├── main.jsx            # App entry: ReactDOM root + BrowserRouter
    ├── App.jsx             # Main app: routes, state, all pages
    ├── apiClient.js        # API base URL + all REST helpers
    ├── styles.css          # Global and component styles
    │
    └── pages/              # Placeholder page components (optional)
        ├── UsersPage.jsx
        ├── ItemsPage.jsx
        ├── CartPage.jsx
        └── OrdersPage.jsx
```

- **`main.jsx`**: Renders `<App />` inside `<BrowserRouter>` and imports global CSS.
- **`App.jsx`**: Holds all UI state, route definitions, and page content (Dashboard, Users, Items, Cart, Orders).
- **`apiClient.js`**: Single `request()` helper and exported functions for User, Items, Cart, and Orders APIs.

---

## Setup & Run

### Prerequisites

- **Node.js** 18+ (project uses Node 21; Vite 6 prefers 18/20/22 but runs on 21)
- **npm** (or yarn/pnpm)

### Install

```bash
cd RaftLabs_UI
npm install
```

### Development

```bash
npm run dev
```

- Dev server: **http://localhost:5173**
- Hot Module Replacement (HMR) for fast refresh.

### Build for production

```bash
npm run build
```

- Output: `dist/` (static assets).

### Preview production build

```bash
npm run preview
```

- Serves `dist/` locally to test the built app.

---

## Configuration

### API base URL

In **`src/apiClient.js`** the backend is configured at the top:

```javascript
// Local backend
// const API_BASE_URL = 'http://localhost:2000';

// Deployed backend (e.g. Vercel)
const API_BASE_URL = 'https://raftlabsapim.vercel.app';
```

- Switch the commented line to point to your backend (local or deployed).
- Backend must allow CORS from the UI origin (e.g. `http://localhost:5173` in dev).

### Vite

- **Port**: 5173 (in `vite.config.js`).
- **Plugin**: `@vitejs/plugin-react-swc` for React + SWC.

---

## Features Overview

### 1. Dashboard (`/`)

- Default route.
- Summary cards: **Users count**, **Items count**, **Orders count** (from API).
- Full-width layout.

### 2. Users (`/users`)

- **List**: Table of users (ID, name, phone, address, actions).
- **Single form**: Create or edit selected user (name, phone, address).
- **Actions**: Edit (select row), Delete, Clear selection.
- Uses: `getUsers`, `createUser`, `updateUser`, `deleteUser`.

### 3. Items (`/items`)

- **List**: Table with image thumbnail, name, description, price, Edit/Delete.
- **Single form**: Create or edit item (name, description, price, image URL).
- **Actions**: Edit, Delete, Clear; form clears after create.
- Uses: `getItems`, `createItem`, `updateItem`, `deleteItem`.
- Requires a selected user (createdBy/updatedBy).

### 4. Cart (`/cart`)

- **Item grid**: Menu items in a 3-column grid with “Add to cart” (same as before).
- **Your Cart**: List of cart lines with quantity +/- and **Place Order**.
- **Hydration**: On load, if user is set, cart is loaded from backend (`getCarts`) for that user.
- **After place order**: Cart and “current order” state are cleared.
- Uses: `getCarts`, `createCart`, `updateCart`, `createOrder`.

### 5. Orders (`/orders`)

- **Current order status**: Shows last placed order ID, status, total (when applicable); optional “simulate status” (auto advance via API).
- **All orders**: List of order cards. Each card shows:
  - **Order ID**, **User ID**, **Status**, **Total (₹)**.
  - **Items**: For each item – image, name, **price × quantity**.
- Uses: `getOrders`, `getOrderById`, `updateOrderStatus`.

---

## API Integration

The app talks to the **RaftLabs backend** (Node.js + Express + MongoDB). All calls go through **`src/apiClient.js`**.

| Resource | Endpoints used |
|----------|----------------|
| **User** | `GET /api/user/all`, `POST /api/user/create`, `PUT /api/user/update`, `DELETE /api/user/delete/:id` |
| **Items** | `GET /api/items/all`, `POST /api/items/create`, `PUT /api/items/update`, `DELETE /api/items/delete/:id` |
| **Cart** | `GET /api/cart/all`, `POST /api/cart/create`, `PUT /api/cart/update`, etc. |
| **Orders** | `GET /api/orders/all`, `GET /api/orders/getbyid/:id`, `POST /api/orders/create`, `PUT /api/orders/updateStatus`, etc. |

- **Base URL**: Set in `apiClient.js` (see Configuration).
- **Format**: JSON request/response; `fetch` with `Content-Type: application/json`.

---

## Routing

| Path     | Description |
|----------|-------------|
| `/`      | Dashboard (counts) |
| `/users` | User CRUD + table |
| `/items` | Items CRUD + table |
| `/cart`  | Item grid + Your Cart + Place Order |
| `/orders`| Current order status + All orders (with items, image, price, quantity, order id, status) |
| `*`      | Redirects to `/` |

- Implemented in `App.jsx` with `<Routes>` and `<Route>`.
- Header uses `<NavLink>` with active class for the current route.

---

## Browser Support

- Modern browsers with ES modules and common React 18 / Vite support (e.g. Chrome, Firefox, Safari, Edge).

---

## License & Repo

- **Project**: RaftLabs Food Ordering – UI.
- **Repo**: Part of RaftLabs interview/repo; see root `README.md` for overall project info.
