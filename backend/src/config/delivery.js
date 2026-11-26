// ── DELIVERY FEE GUIDE (11-26) ─────────────────────────
// Each product carries its own delivery fee, set by the seller from the
// product's weight. The fee may not go above the fair maximum for that
// weight. Buyers can report a fee or weight that looks wrong, and staff
// can warn, remove the product or suspend the seller.
// Mirror: frontend/src/utils/delivery.js. Change both together.
//
// The maximums follow local motorcycle and tricycle delivery inside
// Muntinlupa: light parcels near the usual ₱30 to ₱50 base fare, heavy
// items that need a bigger vehicle or two trips going higher.

export const MAX_WEIGHT_KG = 100;

// Weight brackets, lightest first. upToKg is inclusive.
export const DELIVERY_FEE_GUIDE = [
  { upToKg: 1, maxFee: 30 },
  { upToKg: 3, maxFee: 50 },
  { upToKg: 5, maxFee: 70 },
  { upToKg: 10, maxFee: 100 },
  { upToKg: 20, maxFee: 150 },
  { upToKg: 50, maxFee: 250 },
  { upToKg: MAX_WEIGHT_KG, maxFee: 350 },
];

// Highest fair delivery fee for a product of this weight
export const maxDeliveryFee = (weightKg) => {
  const w = Number(weightKg);
  const row = DELIVERY_FEE_GUIDE.find((r) => w <= r.upToKg) || DELIVERY_FEE_GUIDE[DELIVERY_FEE_GUIDE.length - 1];
  return row.maxFee;
};

// Checks a weight and fee pair. Returns an error message, or null when fine.
export const deliveryProblem = (weightKg, deliveryFee) => {
  const w = Number(weightKg);
  const f = Number(deliveryFee);
  if (!Number.isFinite(w) || w < 0.01 || w > MAX_WEIGHT_KG) {
    return `Weight must be between 0.01 and ${MAX_WEIGHT_KG} kg`;
  }
  if (!Number.isFinite(f) || f < 0) return "Delivery fee must be 0 or more";
  const max = maxDeliveryFee(w);
  if (f > max) {
    return `The delivery fee for a ${w} kg item can be at most ₱${max}. See the delivery fee guide.`;
  }
  return null;
};

// One delivery trip per order, so the order pays the highest fee among
// its products, not the sum
export const orderDeliveryFee = (products) =>
  products.reduce((max, p) => Math.max(max, Number(p.deliveryFee) || 0), 0);
