import { Link, useNavigate } from "react-router-dom";
import { useCartStore } from "../../stores/cart.store.js";

// Cart - phone-first cards, guarded by BuyerRoute outside
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
      <div className="py-16 text-center px-4">
        <h1 className="font-header font-bold text-2xl text-gray-900">
          Your cart is empty
        </h1>
        <p className="font-body text-sm text-passive mt-2">
          Find something good from nearby vendors.
        </p>
        <Link
          to="/browse"
          className="btn-active inline-block mt-6 bg-primary text-white font-body px-6 py-3 rounded-lg"
        >
          Browse goods
        </Link>
      </div>
    );
  }

  return (
    <div className="page-enter">
      {/* Bold header with line count */}
      <h1 className="font-header font-bold text-2xl text-gray-900">
        Your cart
      </h1>
      <p className="font-body text-sm text-passive mt-1">
        {items.length} item type{items.length > 1 ? "s" : ""} from local
        vendors.
      </p>
      {/* Single column on phone, split on desktop, min-w-0 lets tracks shrink */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Lines take two thirds, min-w-0 stops long names pushing wide */}
        <div className="lg:col-span-2 min-w-0 space-y-3">
          {items.map((i) => (
            // Card clips everything inside, never wider than screen
            <div
              key={i.productId}
              className="border border-gray-100 rounded-xl p-3 overflow-hidden"
            >
              {/* Top row - thumb plus name plus price */}
              <div className="flex gap-3 min-w-0">
                {/* Smaller thumb on phones */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                  {i.imageUrl ? (
                    <img
                      src={i.imageUrl}
                      alt={i.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-body text-xs text-passive">
                      No photo
                    </div>
                  )}
                </div>
                {/* Name wraps two lines max, never runs off screen */}
                <div className="flex-1 min-w-0">
                  <p className="font-body font-bold text-sm text-gray-900 line-clamp-2">
                    {i.name}
                  </p>
                  <p className="font-body font-bold text-primary mt-1">
                    P{Number(i.price).toLocaleString()}
                  </p>
                </div>
              </div>
              {/* Bottom row - stepper left, remove right, wraps when tight */}
              <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                {/* Stepper capped at known stock */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQty(i.productId, i.quantity - 1)}
                    className="border border-gray-200 rounded-lg w-9 h-9 font-body"
                    aria-label="Decrease"
                  >
                    -
                  </button>
                  <span className="font-body font-bold text-sm w-6 text-center">
                    {i.quantity}
                  </span>
                  <button
                    onClick={() => updateQty(i.productId, i.quantity + 1)}
                    className="border border-gray-200 rounded-lg w-9 h-9 font-body"
                    aria-label="Increase"
                  >
                    +
                  </button>
                </div>
                {/* Line total plus remove */}
                <div className="flex items-center gap-3">
                  <span className="font-body font-bold text-sm text-gray-900">
                    P{(Number(i.price) * i.quantity).toLocaleString()}
                  </span>
                  <button
                    onClick={() => removeItem(i.productId)}
                    className="font-body text-xs text-danger hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Summary card takes one third, shrink-proof too */}
        <div className="min-w-0 border border-gray-100 rounded-xl p-5 h-fit lg:sticky lg:top-20">
          <h2 className="font-header font-bold text-lg text-gray-900">
            Summary
          </h2>
          {/* Total row wraps on narrow screens */}
          <div className="flex justify-between gap-2 flex-wrap mt-3 font-body text-sm">
            <span className="text-passive">Total</span>
            <span className="font-bold text-primary text-lg">
              P{Number(getTotalAmount()).toLocaleString()}
            </span>
          </div>
          <p className="font-body text-xs text-passive mt-2">
            Pay cash on pickup or delivery, or GCash online at checkout.
          </p>
          {/* Forward to checkout */}
          <button
            onClick={() => navigate("/checkout")}
            className="btn-active w-full mt-4 bg-primary text-white font-body py-3 rounded-lg"
          >
            Proceed to Checkout
          </button>
          <Link
            to="/browse"
            className="block text-center font-body text-sm text-primary mt-3"
          >
            Continue browsing
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;
