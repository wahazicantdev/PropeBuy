import api from "./axios.js";

// Validate one cart line before trusting local stock numbers
export const validateCartItem = async (productId, quantity) => {
  // POST /orders/cart/validate, 400 when short on stock
  const res = await api.post("/orders/cart/validate", { productId, quantity });
  // Returns { success, message, data: product }
  return res.data;
};

// Checkout — the TPS call, atomic on the backend
export const checkoutOrder = async (items, paymentMethod, deliveryType) => {
  // Items shape: [{ productId, quantity }]
  const res = await api.post("/orders/checkout", {
    items,
    paymentMethod,
    deliveryType,
  });
  // Cash returns { data: order }, GCash adds paymentUrl
  return res.data;
};

// Buyer order list, newest first
export const fetchMyOrders = async () => {
  // GET /orders/my-orders, BUYER role only
  const res = await api.get("/orders/my-orders");
  // Returns { success, count, data: [...] }
  return res.data;
};

// Single order with items and buyer info
// Seller access allowed as of Step 1 backend patch
export const fetchOrder = async (id) => {
  // Buyers see own, sellers see orders with their items, admin all
  const res = await api.get(`/orders/${id}`);
  // Returns { success, data: order }
  return res.data;
};

// GCash fallback check when webhook is slow or missed
export const checkPayment = async (id) => {
  // Asks PayMongo directly through the backend
  const res = await api.get(`/orders/${id}/payment-status`);
  // Returns { success, message, data: { paymentStatus } }
  return res.data;
};

// Orders touching this seller — only own items inside each
export const fetchSellerOrders = async () => {
  // GET /orders/seller/received, SELLER role only
  const res = await api.get("/orders/seller/received");
  // Returns { success, count, data: [...buyer, orderItems filtered] }
  return res.data;
};

// Status transition — seller action button, buyer gets socket ping
export const updateOrderStatus = async (id, status) => {
  // Valid: PROCESSING | FULFILLED | CANCELLED
  // CANCELLED restores stock atomically server-side
  const res = await api.put(`/orders/${id}/status`, { status });
  // Returns { success, message, data: updated order }
  return res.data;
};