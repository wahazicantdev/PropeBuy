import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Spinner from "../../components/Spinner.jsx";
import Select from "../../components/Select.jsx";
import { useCartStore } from "../../stores/cart.store.js";
import { checkoutOrder } from "../../api/order.api.js";
// Fresh account status — the stored copy goes stale after admin review
import { fetchMe } from "../../api/auth.api.js";
import { useAuthStore } from "../../stores/auth.store.js";

// Checkout - phone-first picks, guarded by BuyerRoute outside
const Checkout = () => {
  // Cart lines and derived total plus clearer
  const items = useCartStore((s) => s.items);
  const getTotalAmount = useCartStore((s) => s.getTotalAmount);
  const clearCart = useCartStore((s) => s.clearCart);
  // Form state with documentation defaults
  const [deliveryType, setDeliveryType] = useState("PICKUP");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  // Block double submit
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  // Live account status — checkout is VERIFIED-only on the backend
  // (objective 1b), so the page says so instead of failing on tap
  const accountStatus = useAuthStore((s) => s.user?.accountStatus);
  const verified = accountStatus === "VERIFIED";

  // Refresh the stored user once — localStorage still says PENDING
  // after an admin approves, which would wrongly block a now-verified
  // buyer. getState() avoids a stale closure without extra deps.
  useEffect(() => {
    fetchMe()
      .then((res) => {
        const { user, setUser } = useAuthStore.getState();
        if (res.data) setUser({ ...user, ...res.data });
      })
      // Silent — the backend gate still answers honestly on submit
      .catch(() => {});
  }, []);

  // Delivery options straight from the documented enum
  const deliveryOptions = [
    { value: "PICKUP", label: "Store pickup" },
    { value: "DELIVERY", label: "Delivery" },
  ];

  // Empty cart means nothing to pay for, back to browse
  // Loading exempts the just-placed order so clearCart cannot hijack the handoff
  if (items.length === 0 && !loading) return <Navigate to="/browse" replace />;

  // Place order - cash stays in app, GCash leaves same-tab like Shopee
  const placeOrder = async () => {
    setLoading(true);
    try {
      // Shape backend validateCheckout expects
      const payload = items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      }));
      // TPS call, throws on short stock
      const res = await checkoutOrder(payload, paymentMethod, deliveryType);
      // GCash path - cart clears on the return page, never before leaving
      // Clearing here caused the empty-cart guard to hijack the handoff
      if (res.paymentUrl) {
        localStorage.setItem("propebuy_last_order", String(res.data.id));
        // Same-tab handoff, no popup to block and no second tab to lose
        window.location.href = res.paymentUrl;
        return;
      }
      // Cart is spent on cash path, clear before opening the order
      clearCart();
      // Cash path - straight to the new order
      toast.success("Order placed. Prepare your cash payment.");
      navigate(`/orders/${res.data.id}`);
    } catch (err) {
      // BUGFIX: a leftover payTab.close() from the retired new-tab flow
      // threw ReferenceError right here, so the toast below never ran —
      // short-stock failures (the double-selling proof) showed nothing.
      // Short stock or validator message from backend
      toast.error(err.response?.data?.message || "Checkout failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-enter">
      {/* Bold header */}
      <h1 className="font-header font-bold text-2xl text-gray-900">Checkout</h1>
      <p className="font-body text-sm text-passive mt-1">
        Pick how you get it and how you pay.
      </p>
      {/* Single column on phone, split on desktop, min-w-0 lets tracks shrink */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Picks take two thirds, shrink-proof */}
        <div className="lg:col-span-2 min-w-0 space-y-5">
          {/* Delivery pick */}
          <div className="min-w-0">
            <h2 className="font-header font-bold text-lg text-gray-900">
              How do you get it
            </h2>
            <div className="mt-2">
              <Select
                value={deliveryType}
                onChange={setDeliveryType}
                options={deliveryOptions}
                ariaLabel="Delivery type"
              />
            </div>
          </div>
          {/* Payment pick - radio cards stack on phones */}
          <div className="min-w-0">
            <h2 className="font-header font-bold text-lg text-gray-900">
              How do you pay
            </h2>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {/* Cash card */}
              <button
                onClick={() => setPaymentMethod("CASH")}
                className={`min-w-0 text-left border rounded-xl p-4 ${paymentMethod === "CASH" ? "border-primary bg-primary/5" : "border-gray-200"}`}
              >
                <p className="font-body font-bold text-sm text-gray-900">
                  Cash
                </p>
                <p className="font-body text-xs text-passive mt-1">
                  Pay in cash on pickup or delivery.
                </p>
              </button>
              {/* GCash card */}
              <button
                onClick={() => setPaymentMethod("GCASH")}
                className={`min-w-0 text-left border rounded-xl p-4 ${paymentMethod === "GCASH" ? "border-primary bg-primary/5" : "border-gray-200"}`}
              >
                <p className="font-body font-bold text-sm text-gray-900">
                  GCash
                </p>
                <p className="font-body text-xs text-passive mt-1">
                  Pay online now through a secure link.
                </p>
              </button>
            </div>
          </div>
          {/* Lines review, read only here */}
          <div className="min-w-0">
            <h2 className="font-header font-bold text-lg text-gray-900">
              Your items
            </h2>
            <div className="mt-2 space-y-2">
              {items.map((i) => (
                // Row clips long names, total never squeezes out
                <div
                  key={i.productId}
                  className="flex justify-between gap-3 font-body text-sm border border-gray-100 rounded-lg px-4 py-3 overflow-hidden"
                >
                  <span className="text-gray-900 truncate min-w-0">
                    {i.name} x {i.quantity}
                  </span>
                  <span className="font-bold text-primary shrink-0">
                    P{(Number(i.price) * i.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Pay card takes one third, shrink-proof too */}
        <div className="min-w-0 border border-gray-100 rounded-xl p-5 h-fit lg:sticky lg:top-20">
          {/* Total row wraps on narrow screens */}
          <div className="flex justify-between gap-2 flex-wrap font-body text-sm">
            <span className="text-passive">Total to pay</span>
            <span className="font-bold text-primary text-lg">
              P{Number(getTotalAmount()).toLocaleString()}
            </span>
          </div>
          {/* Unverified notice — explains the disabled button up front */}
          {!verified && (
            <p className="font-body text-xs text-danger mt-4 border border-danger/30 bg-danger/5 rounded-lg p-3">
              {accountStatus === "REJECTED"
                ? "Your account is not verified, so orders are blocked. Contact your barangay administrator."
                : "Your documents are still under review. You can order once an admin verifies your account."}
            </p>
          )}
          {/* Submit with spinner state — VERIFIED buyers only */}
          <button
            onClick={placeOrder}
            disabled={loading || !verified}
            className="w-full mt-4 bg-primary text-white font-body py-3 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Spinner /> : null}
            {loading ? "Placing order..." : "Place Order"}
          </button>
          <p className="font-body text-xs text-passive mt-2 text-center">
            Stock is locked the moment you tap this.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
