import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Spinner from "../../components/Spinner.jsx";
import Icon from "../../components/Icon.jsx";
import { formatPeso } from "../../utils/format.js";
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

  // Payment choices — big tappable cards, method decides the whole flow
  const payOptions = [
    { key: "CASH", icon: "payments", title: "Cash", text: "Pay in cash on pickup or delivery." },
    { key: "GCASH", icon: "account_balance_wallet", title: "GCash", text: "Pay online now through a secure PayMongo page." },
  ];

  return (
    <div className="page-enter">
      {/* Breadcrumb */}
      <nav className="font-body text-sm text-black/60 flex items-center gap-1" aria-label="Breadcrumb">
        <Link to="/cart" className="hover:text-black">Cart</Link>
        <Icon name="chevron_right" size={16} />
        <span className="text-black">Checkout</span>
      </nav>
      <h1 className="mt-4 text-3xl md:text-4xl text-black">Checkout</h1>
      <p className="font-body text-sm text-black/60 mt-2">
        Pick how you get it and how you pay.
      </p>

      {/* Choices left, pay card right — stacked on phone, min-w-0 trio */}
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_400px] items-start">
        <div className="min-w-0 space-y-5">
          {/* Delivery pick */}
          <section className="border border-black/10 rounded-xl p-5 md:p-6">
            <h2 className="heading-body text-lg md:text-xl text-black flex items-center gap-2">
              <Icon name="local_shipping" />
              How do you get it
            </h2>
            <div className="mt-4">
              <Select
                value={deliveryType}
                onChange={setDeliveryType}
                options={deliveryOptions}
                ariaLabel="Delivery type"
              />
            </div>
          </section>

          {/* Payment pick — radio cards, black border on the chosen one */}
          <section className="border border-black/10 rounded-xl p-5 md:p-6">
            <h2 className="heading-body text-lg md:text-xl text-black flex items-center gap-2">
              <Icon name="payments" />
              How do you pay
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Payment method">
              {payOptions.map((o) => {
                const on = paymentMethod === o.key;
                return (
                  <button
                    key={o.key}
                    role="radio"
                    aria-checked={on}
                    onClick={() => setPaymentMethod(o.key)}
                    className={`min-w-0 text-left rounded-xl p-4 border-2 transition-colors flex gap-3 ${on ? "border-black bg-surface" : "border-black/10 hover:border-black/30"}`}
                  >
                    <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${on ? "bg-primary text-white" : "bg-surface text-black"}`}>
                      <Icon name={o.icon} />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-body font-bold text-base text-black">{o.title}</span>
                      <span className="block font-body text-xs text-black/60 mt-0.5">{o.text}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Lines review, read only here */}
          <section className="border border-black/10 rounded-xl px-5 md:px-6">
            <h2 className="heading-body text-lg md:text-xl text-black flex items-center gap-2 pt-5 md:pt-6">
              <Icon name="shopping_bag" />
              Your items
            </h2>
            <ul className="mt-2 divide-y divide-black/10">
              {items.map((i) => (
                // Row clips long names, total never squeezes out
                <li key={i.productId} className="py-4 flex items-center gap-3 min-w-0">
                  <span className="relative w-14 h-14 rounded-lg bg-card overflow-hidden shrink-0">
                    {i.imageUrl && <img src={i.imageUrl} alt={i.name} className="absolute inset-0 w-full h-full object-cover" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-body font-bold text-sm text-black truncate">{i.name}</span>
                    <span className="block font-body text-xs text-black/60">Qty {i.quantity} × {formatPeso(i.price)}</span>
                  </span>
                  <span className="font-body font-bold text-base text-black shrink-0">
                    {formatPeso(Number(i.price) * i.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* ── PAY CARD ── */}
        <aside className="min-w-0 border border-black/10 rounded-xl p-5 md:p-6 lg:sticky lg:top-28">
          <h2 className="heading-body text-xl md:text-2xl text-black">Order Summary</h2>
          <dl className="mt-5 space-y-4 font-body text-base">
            <div className="flex justify-between gap-2">
              <dt className="text-black/60">Payment</dt>
              <dd className="font-bold text-black">{paymentMethod === "GCASH" ? "GCash" : "Cash"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-black/60">Delivery</dt>
              <dd className="font-bold text-black">{deliveryType === "DELIVERY" ? "Delivery" : "Store pickup"}</dd>
            </div>
            <hr className="border-black/10" />
            <div className="flex justify-between gap-2 text-lg">
              <dt className="text-black">Total to pay</dt>
              <dd className="font-bold text-2xl text-black">{formatPeso(getTotalAmount())}</dd>
            </div>
          </dl>
          {/* Unverified notice — explains the disabled button up front */}
          {!verified && (
            <p className="font-body text-xs text-danger mt-5 bg-danger/10 rounded-xl p-3 flex gap-2">
              <Icon name="warning" size={18} className="shrink-0" />
              {accountStatus === "REJECTED"
                ? "Your account is not verified, so orders are blocked. Contact your barangay administrator."
                : "Your documents are still under review. You can order once an admin verifies your account."}
            </p>
          )}
          {/* Submit with spinner state — VERIFIED buyers only */}
          <button
            onClick={placeOrder}
            disabled={loading || !verified}
            className="btn-primary btn-active w-full mt-6 py-4 font-body font-medium disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? <Spinner /> : <Icon name="lock" />}
            {loading ? "Placing order..." : "Place Order"}
          </button>
          <p className="font-body text-xs text-black/60 mt-3 text-center">
            Stock is locked the moment you tap this.
          </p>
        </aside>
      </div>
    </div>
  );
};

export default Checkout;
