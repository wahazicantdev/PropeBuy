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
export const fetchOrder = async (id) => {
  // Backend blocks buyers from opening other buyers orders
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
