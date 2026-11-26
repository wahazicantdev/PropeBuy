// ── REPORT REASONS (11-26) ─────────────────────────────
// Same keys as the backend's ReportReason enum. "product" reasons need a
// product, so they only show on a product page.
export const REPORT_REASONS = [
  { key: "UNFAIR_DELIVERY_FEE", label: "Delivery fee is too high for the weight", product: true },
  { key: "WRONG_WEIGHT", label: "Listed weight looks wrong", product: true },
  { key: "NOT_AS_DESCRIBED", label: "Fake or not as described" },
  { key: "PROHIBITED_ITEM", label: "Item is not allowed on PropeBuy" },
  { key: "SCAM", label: "Scam, or asked to pay outside PropeBuy" },
  { key: "SELLER_CONDUCT", label: "Seller was rude, did not show up or did not deliver" },
  { key: "OTHER", label: "Something else" },
];

// Readable label for a reason key
export const reasonLabel = (key) => REPORT_REASONS.find((r) => r.key === key)?.label || key;

// Readable label for what staff did
export const REPORT_ACTION_LABEL = {
  DISMISSED: "Dismissed",
  WARNED: "Seller warned",
  PRODUCT_REMOVED: "Product removed",
  SELLER_SUSPENDED: "Seller suspended",
};
