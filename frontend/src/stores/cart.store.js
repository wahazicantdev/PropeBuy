import { create } from "zustand";
import { persist } from "zustand/middleware";

// One cart line per product and option, e.g. "12:base" or "12:40".
// Older saved carts have no key yet, so it is rebuilt from the ids.
export const lineKey = (i) => i.key || `${i.productId}:${i.variantId ?? "base"}`;

// Cart store — buyer cart, persists on refresh
export const useCartStore = create(
  persist(
    (set, get) => ({
      // ── STATE ──
      items: [], // [{ key, productId, variantId, variantName, name, price, imageUrl, quantity, stock }]
      ownerId: null, // account that owns this cart, null for a guest

      // ── CLAIM FOR AN ACCOUNT ──
      // A guest cart is kept on login. Another account's cart is emptied,
      // so buyers sharing one browser never see each other's items.
      claimFor: (userId) =>
        set((state) =>
          state.ownerId && state.ownerId !== userId
            ? { items: [], ownerId: userId }
            : { ownerId: userId },
        ),

      // ── RESET ON LOGOUT ──
      reset: () => set({ items: [], ownerId: null }),

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
      // Refreshes stock and price, then caps quantity to what is left
      syncLine: (key, { stock, price }) =>
        set((state) => ({
          items: state.items.map((i) =>
            lineKey(i) === key
              ? { ...i, stock, price, quantity: Math.min(i.quantity, stock) }
              : i,
          ),
        })),

      // ── REMOVE ONE ──
      removeItem: (key) =>
        set((state) => ({
          items: state.items.filter((i) => lineKey(i) !== key),
        })),

      // ── CLEAR ALL ──
      // Called after successful checkout
      clearCart: () => set({ items: [] }),

      // ── DERIVED ──
      // Total count + amount, computed not stored
      getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      getTotalAmount: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: "propebuy-cart" },
  ),
);
