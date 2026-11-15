import api from "./axios.js";

// ── SELLER ─────────────────────────────────────────────
// Balances, this year's fees and tax, earnings and payout history
export const fetchMyEarnings = async () => {
  const res = await api.get("/payouts/me");
  return res.data;
};

// Save the GCash account PropeBuy sends payouts to
export const savePayoutAccount = async (gcashName, gcashNumber) => {
  const res = await api.put("/payouts/me/account", { gcashName, gcashNumber });
  return res.data;
};

// ── ADMIN ──────────────────────────────────────────────
// Sellers to pay, refunds due, PropeBuy income this month
export const fetchPayoutOverview = async () => {
  const res = await api.get("/admin/payouts");
  return res.data;
};

// Record a GCash transfer already sent to a seller
export const recordPayout = async (sellerId, referenceNo) => {
  const res = await api.post("/admin/payouts", { sellerId, referenceNo });
  return res.data;
};

// Mark a buyer refund as done after refunding in PayMongo
export const markRefundDone = async (earningId) => {
  const res = await api.patch(`/admin/payouts/refunds/${earningId}`);
  return res.data;
};
