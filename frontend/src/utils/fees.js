// ── PLATFORM FEES (mirror) ─────────────────────────────
// Mirror of backend/src/config/fees.js, used only for previews such as
// "You receive" on the product form. The backend computes the real
// amounts. Change both files together.

// PropeBuy commission on items paid online (GCash). Cash orders pay 0%.
export const COMMISSION_RATE = 0.05;

// What the seller keeps from a GCash sale at this price, in pesos
export const sellerNetOnline = (price) => {
  const p = parseFloat(price);
  if (!(p > 0)) return 0;
  return Math.round(p * (1 - COMMISSION_RATE) * 100) / 100;
};
