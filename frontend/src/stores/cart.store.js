import { create } from "zustand";
import { persist } from "zustand/middleware";

// One cart line per product and option, e.g. "12:base" or "12:40".
// Older saved carts have no key yet, so it is rebuilt from the ids.
export const lineKey = (i) => i.key || `${i.productId}:${i.variantId ?? "base"}`;

// Lines going to checkout: the ones picked in the cart. When nothing was
// picked (an old link to /checkout), a cart from one store goes whole.
// Orders hold one store only (Yoy, 11-18).
export const checkoutLines = (items, keys) => {
  const picked = items.filter((i) => keys.includes(lineKey(i)));
  if (picked.length) return picked;
  const stores = new Set(items.map((i) => i.sellerId));
  return stores.size === 1 && !stores.has(undefined) ? items : [];
};

// Cart store — buyer cart, persists on refresh
export const useCartStore = create(
  persist(
    (set, get) => ({
      // ── STATE ──
      items: [], // [{ key, productId, variantId, variantName, name, price, imageUrl, quantity, stock, sellerId, storeName, barangayName }]
      ownerId: null, // account that owns this cart, null for a guest
      checkoutKeys: [], // lines the buyer ticked in the cart, all from one store
      paymentKeys: [], // lines of a GCash order that left for PayMongo

      // ── CLAIM FOR AN ACCOUNT ──
      // A guest cart is kept on login. Another account's cart is emptied,
      // so buyers sharing one browser never see each other's items.
      claimFor: (userId) =>
        set((state) =>
          state.ownerId && state.ownerId !== userId
            ? { items: [], ownerId: userId, checkoutKeys: [], paymentKeys: [] }
            : { ownerId: userId },
        ),

      // ── RESET ON LOGOUT ──
      reset: () => set({ items: [], ownerId: null, checkoutKeys: [], paymentKeys: [] }),

      // ── ADD TO CART ──
      // Merges if same product and option, caps at stock.
      // variant — the picked option { id, name, price, stock }, or null
      addItem: (product, qty = 1, variant = null) =>
        set((state) => {
          const key = `${product.id}:${variant?.id ?? "base"}`;
          // The option's own price and stock when one was picked
          const stock = variant ? variant.stock : product.stock;
          // Check if already in cart
          const existing = state.items.find((i) => lineKey(i) === key);
          // Merge quantity if exists
          if (existing) {
            return {
              items: state.items.map((i) =>
                lineKey(i) === key
                  ? { ...i, key, quantity: Math.min(i.quantity + qty, stock) }
                  : i,
              ),
            };
          }
          // New line item
          return {
            items: [
              ...state.items,
              {
                key,
                productId: product.id,
                variantId: variant?.id ?? null,
                variantName: variant?.name ?? null,
                name: product.name,
                price: Number(variant ? variant.price : product.price),
                imageUrl: product.imageUrl,
                quantity: qty,
                stock,
                // Store the line belongs to, for the cart's store groups.
                // seller.name is already the public store name.
                sellerId: product.seller?.id ?? product.sellerId,
                storeName: product.seller?.name || null,
                barangayName: product.barangay?.name || null,
              },
            ],
          };
        }),

      // ── UPDATE QTY ──
      updateQty: (key, qty) =>
        set((state) => ({
          items: state.items.map((i) =>
            lineKey(i) === key
              ? { ...i, quantity: Math.max(1, Math.min(qty, i.stock)) }
              : i,
          ),
        })),

      // ── SYNC WITH LIVE PRODUCT ──
      // Refreshes stock, price and the store info, then caps quantity to
      // what is left. Older saved lines get their store info here.
      syncLine: (key, { stock, price, sellerId, storeName, barangayName }) =>
        set((state) => ({
          items: state.items.map((i) =>
            lineKey(i) === key
              ? {
                  ...i,
                  stock,
                  price,
                  quantity: Math.min(i.quantity, stock),
                  sellerId: sellerId ?? i.sellerId,
                  storeName: storeName ?? i.storeName,
                  barangayName: barangayName ?? i.barangayName,
                }
              : i,
          ),
        })),

      // ── PICK LINES FOR CHECKOUT ──
      setCheckoutKeys: (keys) => set({ checkoutKeys: keys }),

      // ── REMOVE BOUGHT LINES ──
      // Cash orders: the picked lines leave the cart, the rest stay
      removeLines: (keys) =>
        set((state) => ({
          items: state.items.filter((i) => !keys.includes(lineKey(i))),
          checkoutKeys: state.checkoutKeys.filter((k) => !keys.includes(k)),
        })),

      // GCash orders: remember the lines before leaving for PayMongo, and
      // remove them only when the buyer comes back paid
      setPaymentKeys: (keys) => set({ paymentKeys: keys }),
      removePaidLines: () =>
        set((state) => ({
          items: state.items.filter((i) => !state.paymentKeys.includes(lineKey(i))),
          checkoutKeys: state.checkoutKeys.filter((k) => !state.paymentKeys.includes(k)),
          paymentKeys: [],
        })),

      // ── REMOVE ONE ──
      removeItem: (key) =>
        set((state) => ({
          items: state.items.filter((i) => lineKey(i) !== key),
        })),

      // ── CLEAR ALL ──
      // Called after successful checkout
      clearCart: () => set({ items: [], checkoutKeys: [], paymentKeys: [] }),

      // ── DERIVED ──
      // Total count + amount, computed not stored
      getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      getTotalAmount: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: "propebuy-cart" },
  ),
);
