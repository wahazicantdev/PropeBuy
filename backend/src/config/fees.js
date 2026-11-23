// ── PLATFORM FEES AND TAX ──────────────────────────────
// One place for every rate used in seller payouts. Change a rate here
// (and its mirror in frontend/src/utils/fees.js, used for previews)
// and the checkout breakdown, earnings and admin reports all follow.

// PropeBuy commission on items paid ONLINE (GCash through PayMongo).
// Cash orders pay no commission: the seller keeps 100% of the cash.
// 5% covers the PayMongo GCash fee (about 2.23%) and leaves PropeBuy a
// small margin for hosting and support.
export const COMMISSION_RATE = 0.05;

// PayMongo's published GCash rate, used only to estimate PropeBuy's own
// net in the admin report. PayMongo deducts it before settling to us.
export const GATEWAY_FEE_RATE = 0.0223;

// BIR RR 16-2023: e-marketplace operators withhold 1% income tax on
// one-half of the gross remittance to an online seller (0.5% effective)
// once the seller's remittances for the year pass ₱500,000.
export const WHT_THRESHOLD = 500000;
export const WHT_RATE = 0.01 * 0.5;

// Rounds money to centavos
export const round2 = (n) => Math.round(Number(n) * 100) / 100;
