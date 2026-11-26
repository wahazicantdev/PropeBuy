import api from "./axios.js";

// ── REPORTS (11-26) ────────────────────────────────────
// A buyer reports a product (from its page) or a store (from an order).
// { productId?, orderId?, reason, details? }
export const sendReport = async (report) => {
  const res = await api.post("/reports", report);
  return res.data;
};
