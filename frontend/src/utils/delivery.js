// ── DELIVERY FEE GUIDE (mirror) ────────────────────────
// Mirror of backend/src/config/delivery.js, used for the seller's guide
// and live checks on the product form. The backend enforces the real
// limit. Change both files together.

export const MAX_WEIGHT_KG = 100;

// Weight brackets, lightest first, with examples for the seller
export const DELIVERY_FEE_GUIDE = [
  { upToKg: 1, maxFee: 30, label: "Up to 1 kg", example: "Shirt, phone case, school supplies" },
  { upToKg: 3, maxFee: 50, label: "Over 1 kg to 3 kg", example: "Pair of shoes, small bag, books" },
  { upToKg: 5, maxFee: 70, label: "Over 3 kg to 5 kg", example: "Rice cooker, small appliance" },
  { upToKg: 10, maxFee: 100, label: "Over 5 kg to 10 kg", example: "Electric fan, set of pots" },
  { upToKg: 20, maxFee: 150, label: "Over 10 kg to 20 kg", example: "Small cabinet, monoblock chair set" },
  { upToKg: 50, maxFee: 250, label: "Over 20 kg to 50 kg", example: "Table, large storage box" },
  { upToKg: MAX_WEIGHT_KG, maxFee: 350, label: `Over 50 kg to ${MAX_WEIGHT_KG} kg`, example: "Bed frame, large furniture" },
];

// Highest fair delivery fee for a product of this weight
export const maxDeliveryFee = (weightKg) => {
  const w = Number(weightKg);
  const row = DELIVERY_FEE_GUIDE.find((r) => w <= r.upToKg) || DELIVERY_FEE_GUIDE[DELIVERY_FEE_GUIDE.length - 1];
  return row.maxFee;
};

// One trip per order: the order pays the highest fee among its products
export const orderDeliveryFee = (products) =>
  products.reduce((max, p) => Math.max(max, Number(p?.deliveryFee) || 0), 0);
