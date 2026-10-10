import { create } from "zustand";
import { persist } from "zustand/middleware";

// Cart store — buyer cart, persists on refresh
export const useCartStore = create(
  persist(
    (set, get) => ({
      // ── STATE ──
      items: [], // [{ productId, name, price, imageUrl, quantity, stock }]

      // ── ADD TO CART ──
      // Merges if same product, caps at stock
      addItem: (product, qty = 1) =>
        set((state) => {
          // Check if already in cart
          const existing = state.items.find((i) => i.productId === product.id);
          // Merge quantity if exists
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === product.id
                  ? {
                      ...i,
                      quantity: Math.min(i.quantity + qty, product.stock),
                    }
                  : i,
              ),
            };
          }
          // New line item
          return {
            items: [
              ...state.items,
              {
                productId: product.id,
                name: product.name,
                price: Number(product.price),
                imageUrl: product.imageUrl,
                quantity: qty,
                stock: product.stock,
              },
            ],
          };
        }),

      // ── UPDATE QTY ──
      updateQty: (productId, qty) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId
              ? { ...i, quantity: Math.max(1, Math.min(qty, i.stock)) }
              : i,
          ),
        })),

      // ── REMOVE ONE ──
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
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
