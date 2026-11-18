import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCartStore, lineKey } from "../../stores/cart.store.js";
import Icon from "../../components/Icon.jsx";
import ConfirmModal from "../../components/ConfirmModal.jsx";
import { formatPeso } from "../../utils/format.js";
import { removeDeadCartItems } from "../../utils/cartCheck.js";
import { cld } from "../../utils/photos.js";

// Store group id of a line. Older saved lines get their store from the
// stock check, and wait under "checking" until then.
const groupOf = (i) => (i.sellerId == null ? "checking" : String(i.sellerId));

// Cart — lines grouped by store, each with a tick box. Only ticked lines
// go to checkout, and they must all come from one store, because each
// store packs, delivers and charges its own delivery fee (Yoy, 11-18).
const Cart = () => {
  // Lines plus writers
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const setCheckoutKeys = useCartStore((s) => s.setCheckoutKeys);
  const navigate = useNavigate();

  // Ticked lines. Starts from the last pick, or the whole cart when it
  // holds one store only.
  const [ticked, setTicked] = useState(() => {
    const { items: all, checkoutKeys } = useCartStore.getState();
    const kept = checkoutKeys.filter((k) => all.some((i) => lineKey(i) === k));
    if (kept.length) return kept;
    const stores = new Set(all.map(groupOf));
    return stores.size === 1 && !stores.has("checking") ? all.map(lineKey) : [];
  });
  // Pick from another store waiting for the buyer's answer:
  // { keys, storeName } or null
  const [switchTo, setSwitchTo] = useState(null);

  // Same stock check as Checkout, so sold out items leave as soon as the
  // buyer looks at the cart. It also fills in the store of older lines.
  useEffect(() => {
    removeDeadCartItems();
  }, []);

  // Empty state - no lines yet
  if (items.length === 0) {
    return (
      <div className="py-20 text-center px-4 page-enter">
        <span className="inline-flex w-20 h-20 rounded-full bg-surface items-center justify-center">
          <Icon name="shopping_cart" size={36} />
        </span>
        <h1 className="mt-5 text-2xl md:text-3xl text-black">Your cart is empty</h1>
        <p className="font-body text-sm text-black/60 mt-2">
          Find something good from nearby vendors.
        </p>
        <Link to="/browse" className="btn-primary btn-active inline-block mt-6 px-12 py-3.5 font-body font-medium">
          Shop now
        </Link>
      </div>
    );
  }

  // ── STORE GROUPS ──
  // One group per store, in the order the lines were added
  const groups = [];
  items.forEach((i) => {
    const id = groupOf(i);
    let g = groups.find((x) => x.id === id);
    if (!g) {
      g = { id, sellerId: i.sellerId, storeName: i.storeName, barangayName: i.barangayName, lines: [] };
      groups.push(g);
    }
    g.lines.push(i);
  });

  // Ticks that still point at a line (removed lines drop out)
  const picked = items.filter((i) => ticked.includes(lineKey(i)));
  const pickedGroup = picked.length ? groupOf(picked[0]) : null;
  const pickedStore = groups.find((g) => g.id === pickedGroup)?.storeName || "this store";
  const units = picked.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = picked.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0);

  // Tick lines of one group. Lines from another store than the current
  // pick open the explainer instead of mixing stores.
  const pick = (group, keys) => {
    if (pickedGroup && pickedGroup !== group.id) {
      setSwitchTo({ keys, storeName: group.storeName || "the other store" });
      return;
    }
    setTicked((t) => [...new Set([...t.filter((k) => items.some((i) => lineKey(i) === k)), ...keys])]);
  };

  // One line's box
  const toggleLine = (group, key) => {
    if (ticked.includes(key)) setTicked((t) => t.filter((k) => k !== key));
    else pick(group, [key]);
  };

  // A store's box: tick every line of it, or untick them all
  const toggleGroup = (group) => {
    const keys = group.lines.map(lineKey);
    const all = keys.every((k) => ticked.includes(k));
    if (all) setTicked((t) => t.filter((k) => !keys.includes(k)));
    else pick(group, keys);
  };

  // Hand the picked lines to checkout
  const goToCheckout = () => {
    setCheckoutKeys(picked.map(lineKey));
    navigate("/checkout");
  };

  return (
    <div className="page-enter">
      {/* Breadcrumb */}
      <nav className="font-body text-sm text-black/60 flex items-center gap-1" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-black">Home</Link>
        <Icon name="chevron_right" size={16} />
        <span className="text-black">Cart</span>
      </nav>
      <h1 className="mt-4 text-3xl md:text-4xl text-black">Your cart</h1>
      <p className="font-body text-sm text-black/60 mt-2">
        Tick the items to check out. You can check out one store at a time.
      </p>

      {/* Store groups left, summary right — stacked on phone */}
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_400px] items-start">
        <div className="min-w-0 space-y-4">
          {groups.map((g) => {
            const keys = g.lines.map(lineKey);
            const allTicked = keys.every((k) => ticked.includes(k));
            const someTicked = !allTicked && keys.some((k) => ticked.includes(k));
            const checking = g.id === "checking";
            return (
              <section key={g.id} className="min-w-0 border border-black/10 rounded-xl">
                {/* ── Store row: tick the whole store ── */}
                <div className="px-4 md:px-6 py-3 flex items-center gap-3 border-b border-black/10 bg-surface rounded-t-xl">
                  <input
                    type="checkbox"
                    checked={allTicked}
                    ref={(el) => el && (el.indeterminate = someTicked)}
                    onChange={() => toggleGroup(g)}
                    disabled={checking}
                    aria-label={`Tick every item from ${g.storeName || "this store"}`}
                    className="w-5 h-5 accent-black shrink-0 cursor-pointer disabled:cursor-wait"
                  />
                  <Icon name="storefront" size={20} className="shrink-0" />
                  {checking ? (
                    <span className="font-body text-sm text-black/60">Checking the store...</span>
                  ) : (
                    <Link to={`/store/${g.sellerId}`} className="min-w-0 font-body text-sm truncate hover:underline">
                      <span className="text-black/60">From </span>
                      <span className="font-bold text-black">{g.storeName || "Local vendor"}</span>
                      {g.barangayName && <span className="text-black/60"> · {g.barangayName}</span>}
                    </Link>
                  )}
                </div>

                {/* ── Lines of this store ── */}
                <ul className="px-4 md:px-6 divide-y divide-black/10">
                  {g.lines.map((i) => (
                    <li key={lineKey(i)} className="py-4 md:py-6 flex gap-3 md:gap-4 min-w-0">
                      <input
                        type="checkbox"
                        checked={ticked.includes(lineKey(i))}
                        onChange={() => toggleLine(g, lineKey(i))}
                        disabled={checking}
                        aria-label={`Check out ${i.name}`}
                        className="w-5 h-5 mt-1 accent-black shrink-0 cursor-pointer disabled:cursor-wait"
                      />
                      {/* Thumb — card gray tile */}
                      <Link to={`/product/${i.productId}`} className="relative w-20 h-20 md:w-28 md:h-28 shrink-0 bg-card rounded-xl overflow-hidden">
                        {i.imageUrl ? (
                          <img src={cld(i.imageUrl, 200)} alt={i.name} className="absolute inset-0 w-full h-full object-cover" />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center text-black/25">
                            <Icon name="image" size={28} />
                          </span>
                        )}
                      </Link>

                      {/* Name, unit price, controls */}
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-start gap-2">
                          <Link to={`/product/${i.productId}`} className="font-body font-bold text-base md:text-lg text-black line-clamp-2 hover:underline">
                            {i.name}
                            {/* Picked option, e.g. Small or Red */}
                            {i.variantName && <span className="block font-normal text-sm text-black/60">{i.variantName}</span>}
                          </Link>
                          {/* Trash — red delete */}
                          <button
                            onClick={() => removeItem(lineKey(i))}
                            className="ml-auto p-1 text-danger shrink-0"
                            aria-label={`Remove ${i.name}`}
                          >
                            <Icon name="delete" size={22} />
                          </button>
                        </div>
                        <p className="font-body text-xs md:text-sm text-black/60 mt-1">
                          {formatPeso(i.price)} each · {i.stock} in stock
                        </p>
                        {/* Line total + quantity pill, pinned to the bottom */}
                        <div className="mt-auto pt-3 flex items-center justify-between gap-3 flex-wrap">
                          <p className="font-body font-bold text-lg md:text-xl text-black">
                            {formatPeso(Number(i.price) * i.quantity)}
                          </p>
                          {/* Pill stepper — capped at known stock by the store */}
                          <div className="h-10 bg-surface rounded-full flex items-center gap-4 px-4">
                            <button onClick={() => updateQty(lineKey(i), i.quantity - 1)} aria-label="Decrease" className="disabled:opacity-30" disabled={i.quantity <= 1}>
                              <Icon name="remove" />
                            </button>
                            <span className="font-body font-medium text-sm w-5 text-center">{i.quantity}</span>
                            <button onClick={() => updateQty(lineKey(i), i.quantity + 1)} aria-label="Increase" className="disabled:opacity-30" disabled={i.quantity >= i.stock}>
                              <Icon name="add" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        {/* ── ORDER SUMMARY — ticked lines only ── */}
        <aside className="min-w-0 border border-black/10 rounded-xl p-5 md:p-6 lg:sticky lg:top-28">
          <h2 className="heading-body text-xl md:text-2xl text-black">
            Order Summary
          </h2>
          {picked.length > 0 && (
            <p className="mt-2 font-body text-sm text-black/60 truncate">
              From <span className="font-bold text-black">{pickedStore}</span>
            </p>
          )}
          <dl className="mt-5 space-y-4 font-body text-base">
            <div className="flex justify-between gap-2">
              <dt className="text-black/60">Subtotal ({units} item{units === 1 ? "" : "s"})</dt>
              <dd className="font-bold text-black">{formatPeso(subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-black/60">Delivery fee</dt>
              <dd className="font-bold text-black">Shown at checkout</dd>
            </div>
            <hr className="border-black/10" />
            <div className="flex justify-between gap-2 text-lg">
              <dt className="text-black">Total</dt>
              <dd className="font-bold text-2xl text-black">{formatPeso(subtotal)}</dd>
            </div>
          </dl>
          {/* How you can pay — set expectations before checkout */}
          <p className="mt-4 font-body text-xs text-black/60 flex items-start gap-2">
            <Icon name="info" size={16} className="mt-0.5 shrink-0" />
            Pay cash on pickup or delivery, or GCash online at checkout. Stock is
            locked the moment you place the order.
          </p>
          <button
            onClick={goToCheckout}
            disabled={picked.length === 0}
            className="btn-primary btn-active w-full mt-6 py-4 font-body font-medium flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {picked.length ? `Check out ${units} item${units === 1 ? "" : "s"}` : "Tick items to check out"}
            <Icon name="arrow_forward" />
          </button>
          <Link to="/browse" className="block text-center font-body text-sm text-black/60 hover:text-black mt-4">
            Continue shopping
          </Link>
        </aside>
      </div>

      {/* One store per checkout — why, and the way forward */}
      <ConfirmModal
        open={!!switchTo}
        tone="primary"
        size="md"
        title="One store per checkout"
        message={
          switchTo
            ? `You already ticked items from ${pickedStore}. Each store packs, delivers and charges its own delivery fee, so items from different stores cannot go in one order. Check out ${pickedStore} first, then come back here for ${switchTo.storeName}.`
            : ""
        }
        confirmLabel={switchTo ? `Switch to ${switchTo.storeName}` : "Switch"}
        cancelLabel={`Keep ${pickedStore}`}
        onConfirm={() => {
          setTicked(switchTo.keys);
          setSwitchTo(null);
        }}
        onCancel={() => setSwitchTo(null)}
      />
    </div>
  );
};

export default Cart;
