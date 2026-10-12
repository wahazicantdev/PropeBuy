import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { checkPayment } from "../../api/order.api.js";
import { useCartStore } from "../../stores/cart.store.js";

// Payment return page - PayMongo sends GCash buyers back here
const PaymentSuccess = () => {
  // Order id prefers the URL PayMongo appends, localStorage is the fallback
  const [urlParams] = useSearchParams();
  const [orderId] = useState(
    () =>
      urlParams.get("orderId") || localStorage.getItem("propebuy_last_order"),
  );
  // Confirmation state machine: checking, paid, unknown
  const [state, setState] = useState(orderId ? "checking" : "unknown");
  // Seconds left before auto-return to the order
  const [countdown, setCountdown] = useState(5);
  // Attempt counter ref, no re-render needed
  const tries = useRef(0);
  const navigate = useNavigate();
  // Cart clearer for the return trip, deferred past mount for lint
  const clearCart = useCartStore((s) => s.clearCart);
  useEffect(() => {
    // Paid order means the cart lines are spent, wipe once on return
    const t = setTimeout(() => clearCart(), 0);
    return () => clearTimeout(t);
  }, [clearCart]);

  // Poll backend which asks PayMongo directly
  useEffect(() => {
    // Nothing to check without a remembered order
    if (!orderId) return;
    // Timer handle for cleanup
    const timer = setInterval(async () => {
      tries.current += 1;
      try {
        // Fallback status check
        const res = await checkPayment(orderId);
        // Paid means webhook or check confirmed the money
        if (res.data?.paymentStatus === "PAID") {
          setState("paid");
          clearInterval(timer);
        } else if (tries.current >= 20) {
          // Twenty tries at 3 seconds is one minute, stop polling
          setState("unknown");
          clearInterval(timer);
        }
      } catch {
        // Network hiccup, keep polling until tries run out
        if (tries.current >= 20) {
          setState("unknown");
          clearInterval(timer);
        }
      }
    }, 3000);
    // Cleanup timer on unmount
    return () => clearInterval(timer);
  }, [orderId]);

  // Five-second return trip once money is confirmed
  useEffect(() => {
    // Only run after paid, reset the counter each time
    if (state !== "paid") return;
    setCountdown(5);
    // Tick down once per second
    const ticker = setInterval(() => {
      setCountdown((c) => {
        // Zero means go to the order now
        if (c <= 1) {
          clearInterval(ticker);
          navigate(`/orders/${orderId}`);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    // Cleanup ticker on unmount
    return () => clearInterval(ticker);
  }, [state, orderId, navigate]);

  return (
    <div className="min-h-screen bg-white page-enter">
      <main className="max-w-md mx-auto px-4 py-16 text-center">
        {/* Bold header per state */}
        <h1 className="font-header font-bold text-2xl text-gray-900">
          {state === "paid"
            ? "Payment confirmed"
            : state === "checking"
              ? "Confirming payment..."
              : "Thanks for paying"}
        </h1>
        {/* Plain words per state, countdown shown when paid */}
        <p className="font-body text-sm text-passive mt-2">
          {state === "paid"
            ? `Your GCash payment went through. Returning to your order in ${countdown}...`
            : state === "checking"
              ? "Asking the payment provider now. This usually takes a few seconds."
              : "If money left your GCash, it reflects on your order shortly."}
        </p>
        {/* Next steps, view-now skips the wait */}
        <div className="mt-6 flex flex-col gap-3">
          {orderId && (
            <Link
              to={`/orders/${orderId}`}
              className="bg-primary text-white font-body py-3 rounded-lg"
            >
              View My Order Now
            </Link>
          )}
          <Link
            to="/orders"
            className="border border-gray-200 font-body py-3 rounded-lg text-gray-900"
          >
            Order History
          </Link>
          <Link to="/browse" className="font-body text-sm text-primary">
            Back to browse
          </Link>
        </div>
      </main>
    </div>
  );
};

export default PaymentSuccess;
