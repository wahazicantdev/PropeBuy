// ── PUBLIC SELLER IDENTITY (Yoy, 11-17) ────────────────
// Buyers see a seller's store name only. The real name (the one on the
// ID and certificate) stays visible to the seller and the admin.

// Shown when a verified seller has not picked a store name yet
export const FALLBACK_STORE_NAME = "Local seller";

// Swaps the real name for the store name before a seller object leaves
// for a buyer or a guest. Keeps every other field as it is.
export const toPublicSeller = (seller) => {
  if (!seller) return seller;
  const { storeName, ...rest } = seller;
  return { ...rest, name: storeName || FALLBACK_STORE_NAME };
};

// Same swap for a list of products that carry a seller
export const withPublicSellers = (products) =>
  products.map((p) => (p?.seller ? { ...p, seller: toPublicSeller(p.seller) } : p));

// Checks a store name typed by a seller. Returns { error } or { value }.
export const readStoreName = (raw) => {
  const value = typeof raw === "string" ? raw.trim().replace(/\s+/g, " ") : "";
  if (value.length < 3 || value.length > 60) return { error: "Store name must be between 3 and 60 characters" };
  return { value };
};
