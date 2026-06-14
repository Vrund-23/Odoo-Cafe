// Central API client — all requests go to the Express server at :5000
const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getToken() {
  try {
    const raw = localStorage.getItem("cafe-auth-token");
    return raw ? raw.replace(/^"|"$/g, "") : null;
  } catch {
    return null;
  }
}

async function request(method, path, body) {
  const token = getToken();
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401) {
      clearToken();
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    }
    throw new Error(json.message || `API error ${res.status}`);
  }

  // Handle both { data: ... } and raw array/object responses
  return json.data !== undefined ? json.data : json;
}

// ── Auth ──────────────────────────────────────────────────
export const authApi = {
  login: (email, password) => request("POST", "/auth/login", { email, password }),
  register: (data) => request("POST", "/auth/register", data),
  getProfile: () => request("GET", "/auth/profile"),
  getAllUsers: () => request("GET", "/auth/employees"),
  updateUser: (id, data) => request("PUT", `/auth/employees/${id}`, data),
  deleteUser: (id) => request("DELETE", `/auth/employees/${id}`),
};

// ── Categories ────────────────────────────────────────────
export const categoryApi = {
  getAll: () => request("GET", "/categories"),
  create: (data) => request("POST", "/categories", data),
  update: (id, data) => request("PUT", `/categories/${id}`, data),
  delete: (id) => request("DELETE", `/categories/${id}`),
};

// ── Products ──────────────────────────────────────────────
export const productApi = {
  getAll: () => request("GET", "/products"),
  create: (data) => request("POST", "/products", data),
  update: (id, data) => request("PUT", `/products/${id}`, data),
  delete: (id) => request("DELETE", `/products/${id}`),
};

// ── Payment Methods ───────────────────────────────────────
export const paymentApi = {
  getAll: () => request("GET", "/payment-methods"),
  create: (data) => request("POST", "/payment-methods", data),
  update: (id, data) => request("PUT", `/payment-methods/${id}`, data),
  delete: (id) => request("DELETE", `/payment-methods/${id}`),
};

// ── Payment Gateway (Razorpay) ────────────────────────────
export const paymentGatewayApi = {
  createOrder: (data) => request("POST", "/payment/razorpay/order", data),
  verifyPayment: (data) => request("POST", "/payment/razorpay/verify", data),
};

// ── Floors ────────────────────────────────────────────────
export const floorApi = {
  getAll: () => request("GET", "/floors"),
  create: (data) => request("POST", "/floors", data),
  update: (id, data) => request("PUT", `/floors/${id}`, data),
  delete: (id) => request("DELETE", `/floors/${id}`),
};

// ── Tables ────────────────────────────────────────────────
export const tableApi = {
  getAll: () => request("GET", "/tables"),
  create: (data) => request("POST", "/tables", data),
  update: (id, data) => request("PUT", `/tables/${id}`, data),
  delete: (id) => request("DELETE", `/tables/${id}`),
};

// ── Coupons / Promotions ──────────────────────────────────
export const couponApi = {
  getAll: () => request("GET", "/coupons"),
  create: (data) => request("POST", "/coupons", data),
  update: (id, data) => request("PUT", `/coupons/${id}`, data),
  delete: (id) => request("DELETE", `/coupons/${id}`),
};

// ── Customers ─────────────────────────────────────────────
export const customerApi = {
  getAll: () => request("GET", "/customers"),
  create: (data) => request("POST", "/customers", data),
  update: (id, data) => request("PUT", `/customers/${id}`, data),
  delete: (id) => request("DELETE", `/customers/${id}`),
};

// ── Orders ────────────────────────────────────────────────
export const orderApi = {
  getAll: () => request("GET", "/orders"),
  getBySession: (sessionId) => request("GET", `/orders/by-session/${sessionId}`),
  getOne: (id) => request("GET", `/orders/${id}`),
  create: (data) => request("POST", "/orders", data),
  update: (id, data) => request("PUT", `/orders/${id}/status`, data), // Server expects /status
  delete: (id) => request("DELETE", `/orders/${id}`),
  pay: (id, data) => request("PUT", `/orders/${id}/status`, data), // Alias for status update
};

// ── Sessions ──────────────────────────────────────────────
export const sessionApi = {
  getAll: () => request("GET", "/sessions"),
  getOpenSession: () => request("GET", "/sessions/my-open"),
  open: (data) => request("POST", "/sessions", data),
  close: (id, data) => request("PUT", `/sessions/${id}/close`, data),
};

// ── Kitchen ───────────────────────────────────────────────
export const kitchenApi = {
  getAll: () => request("GET", "/kitchen/orders"),
  updateStatus: (id, status) => request("PUT", `/kitchen/orders/${id}/status`, { status }),
  complete: (id) => request("PUT", `/kitchen/orders/${id}/complete`),
};

// Save and retrieve auth token
export function saveToken(token) {
  localStorage.setItem("cafe-auth-token", JSON.stringify(token));
}
export function clearToken() {
  localStorage.removeItem("cafe-auth-token");
}
