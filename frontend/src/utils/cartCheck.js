import toast from "react-hot-toast";
import { fetchProduct } from "../api/product.api.js";
import { useCartStore, lineKey } from "../stores/cart.store.js";

// Compares the saved cart with live products and drops anything gone
// or sold out, so buyers see why a line left their cart.
export const removeDeadCartItems = async () => {
  const { items, removeItem, syncLine } = useCartStore.getState();

  // Look up every line at once
  const checks = await Promise.all(
    items.map(async (item) => {
      try {
        const res = await fetchProduct(item.productId);
        return { item, product: res.data };
      } catch (err) {
        // Only a 404 means it is gone — a network error must not empty a cart
        return { item, unknown: err.response?.status !== 404 };
      }
    }),
  );

  const removedNames = [];
  const loweredNames = [];
  checks.forEach(({ item, product: live, unknown }) => {
    // Could not check this line, leave it for the backend to judge
    if (unknown) return;
    const label = item.variantName ? `${item.name} (${item.variantName})` : item.name;
    // A line with an option is checked against that option. A plain line
    // whose product now has options must be picked again.
    const variants = live?.variants || [];
    const option = item.variantId ? variants.find((v) => v.id === item.variantId) : null;
    const gone = !live || (item.variantId ? !option : variants.length > 0);
    const product = option ? { ...live, stock: option.stock, price: option.price } : live;
    if (gone || product.stock <= 0) {
      removeItem(lineKey(item));
      removedNames.push(label);
      return;
    }
    // Seller has fewer left than the buyer wanted — say so
    if (product.stock < item.quantity) {
      loweredNames.push(`${label} (only ${product.stock} left)`);
    }
    syncLine(lineKey(item), {
      stock: product.stock,
      price: Number(product.price),
    });
  });

  // One message covers every removed line
  if (removedNames.length > 0) {
    toast.error(
      `${removedNames.join(", ")} ${removedNames.length === 1 ? "is" : "are"} out of stock and removed from your cart.`,
      // Fixed id — the check can run twice, the message shows once
      { id: "cart-removed" },
    );
  }

  // One message for every lowered quantity
  if (loweredNames.length > 0) {
    toast(`Quantity updated: ${loweredNames.join(", ")}.`, {
      id: "cart-lowered",
    });
  }
};
