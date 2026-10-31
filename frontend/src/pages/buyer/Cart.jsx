import { Link, useNavigate } from "react-router-dom";
import { useCartStore } from "../../stores/cart.store.js";
import Icon from "../../components/Icon.jsx";
import { formatPeso } from "../../utils/format.js";

// Cart — SHOP.CO "YOUR CART": one bordered card of line items with
// dividers, quantity pills and a red trash icon, plus an order summary
// card. Guarded by BuyerRoute outside. Totals stay derived from the
// store — never stored, never stale.
const Cart = () => {
  // Lines plus writers plus derived totals
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const getTotalAmount = useCartStore((s) => s.getTotalAmount);
  const navigate = useNavigate();

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

  // Unit count for the summary line — lines can hold several units
  const units = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="page-enter">
      {/* Breadcrumb */}
      <nav className="font-body text-sm text-black/60 flex items-center gap-1" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-black">Home</Link>
        <Icon name="chevron_right" size={16} />
        <span className="text-black">Cart</span>
      </nav>
      <h1 className="mt-4 text-3xl md:text-4xl text-black">Your cart</h1>

      {/* Lines left, summary right — stacked on phone, min-w-0 trio */}
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_400px] items-start">
        {/* ── LINE ITEMS — one card, divided rows ── */}
        <ul className="min-w-0 border border-black/10 rounded-xl px-4 md:px-6 divide-y divide-black/10">
          {items.map((i) => (
            <li key={i.productId} className="py-4 md:py-6 flex gap-4 min-w-0">
              {/* Thumb — card gray tile */}
              <Link to={`/product/${i.productId}`} className="relative w-24 h-24 md:w-32 md:h-32 shrink-0 bg-card rounded-xl overflow-hidden">
                {i.imageUrl ? (
                  <img src={i.imageUrl} alt={i.name} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-black/25">
                    <Icon name="image" size={28} />
                  </span>
                )}
              </Link>

              {/* Name, unit price, controls */}
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-start gap-2">
                  <Link to={`/product/${i.productId}`} className="font-body font-bold text-base md:text-xl text-black line-clamp-2 hover:underline">
                    {i.name}
                  </Link>
                  {/* Trash — red, the reference's delete affordance */}
                  <button
                    onClick={() => removeItem(i.productId)}
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
                  <p className="font-body font-bold text-xl md:text-2xl text-black">
                    {formatPeso(Number(i.price) * i.quantity)}
                  </p>
                  {/* Pill stepper — capped at known stock by the store */}
                  <div className="h-10 md:h-11 bg-surface rounded-full flex items-center gap-4 px-4">
                    <button onClick={() => updateQty(i.productId, i.quantity - 1)} aria-label="Decrease" className="disabled:opacity-30" disabled={i.quantity <= 1}>
                      <Icon name="remove" />
                    </button>
                    <span className="font-body font-medium text-sm w-5 text-center">{i.quantity}</span>
                    <button onClick={() => updateQty(i.productId, i.quantity + 1)} aria-label="Increase" className="disabled:opacity-30" disabled={i.quantity >= i.stock}>
                      <Icon name="add" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* ── ORDER SUMMARY ── */}
        <aside className="min-w-0 border border-black/10 rounded-xl p-5 md:p-6 lg:sticky lg:top-28">
          <h2 className="heading-body text-xl md:text-2xl text-black">
            Order Summary
          </h2>
          <dl className="mt-5 space-y-4 font-body text-base">
            <div className="flex justify-between gap-2">
              <dt className="text-black/60">Subtotal ({units} item{units === 1 ? "" : "s"})</dt>
              <dd className="font-bold text-black">{formatPeso(getTotalAmount())}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-black/60">Delivery fee</dt>
              <dd className="font-bold text-black">Arranged with vendor</dd>
            </div>
            <hr className="border-black/10" />
            <div className="flex justify-between gap-2 text-lg">
              <dt className="text-black">Total</dt>
              <dd className="font-bold text-2xl text-black">{formatPeso(getTotalAmount())}</dd>
            </div>
          </dl>
          {/* How you can pay — set expectations before checkout */}
          <p className="mt-4 font-body text-xs text-black/60 flex items-start gap-2">
            <Icon name="info" size={16} className="mt-0.5" />
            Pay cash on pickup or delivery, or GCash online at checkout. Stock is
            locked the moment you place the order.
          </p>
          <button
            onClick={() => navigate("/checkout")}
            className="btn-primary btn-active w-full mt-6 py-4 font-body font-medium flex items-center justify-center gap-2"
          >
            Go to Checkout
            <Icon name="arrow_forward" />
          </button>
          <Link to="/browse" className="block text-center font-body text-sm text-black/60 hover:text-black mt-4">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
};

export default Cart;
