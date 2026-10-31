import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { OrderPill, PaymentPill } from "../../components/OrderStatus.jsx";
import { fetchOrder, checkPayment } from "../../api/order.api.js";
import Icon from "../../components/Icon.jsx";
import { formatPeso } from "../../utils/format.js";
// Live tick — socket events refetch this page, no manual refresh
import { useLiveTick } from "../../hooks/useSocket.js";

// Order detail - one order with items, totals, payment recheck
const OrderDetail = () => {
  // Id from URL /orders/:id
  const { id } = useParams();
  // Order state with items
  const [order, setOrder] = useState(null);
  // Loading flags, page plus recheck button
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  // Load once by id
  // Bumps on status or payment events — the stepper moves on its own
  const live = useLiveTick();

  useEffect(() => {
    fetchOrder(id)
      .then((res) => setOrder(res.data))
      .catch(() => toast.error("Order not found"))
      .finally(() => setLoading(false));
  }, [id, live]);

  // Manual GCash recheck for slow webhooks
  const recheck = async () => {
    setChecking(true);
    try {
      // Backend asks PayMongo directly
      const res = await checkPayment(id);
      // Refresh local order when money confirmed
      if (res.data?.paymentStatus === "PAID") {
        const fresh = await fetchOrder(id);
        setOrder(fresh.data);
      }
      toast.success(
        res.updated
          ? "Payment confirmed"
          : `Payment is ${res.data?.paymentStatus || "pending"}`,
      );
    } catch {
      toast.error("Could not check payment right now");
    } finally {
      setChecking(false);
    }
  };

  // Loading and missing states
  if (loading)
    return (
      <div className="py-20 flex justify-center">
        <span className="spinner" />
      </div>
    );
  if (!order)
    return (
      <div className="py-20 text-center">
        <p className="font-header text-xl text-black">Order not found</p>
        <Link to="/orders" className="btn-primary btn-active inline-block mt-6 px-10 py-3 font-body font-medium">
          Back to orders
        </Link>
      </div>
    );

  // Stepper helpers - three happy steps in order
  const steps = ["RESERVED", "PROCESSING", "FULFILLED"];
  const stepLabels = {
    RESERVED: "Reserved",
    PROCESSING: "Processing",
    FULFILLED: "Fulfilled",
  };
  const stepIndex = steps.indexOf(order.status);

  // Recheck shows only for GCash money still waiting
  const showRecheck =
    order.paymentMethod === "GCASH" && order.paymentStatus === "PENDING";

  return (
    <div className="page-enter">
      {/* Breadcrumb */}
      <nav className="font-body text-sm text-black/60 flex items-center gap-1" aria-label="Breadcrumb">
        <Link to="/orders" className="hover:text-black">My orders</Link>
        <Icon name="chevron_right" size={16} />
        <span className="text-black">Order #{order.id}</span>
      </nav>
      <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-3xl md:text-4xl text-black">Order #{order.id}</h1>
        <span className="flex gap-2">
          <OrderPill status={order.status} />
          <PaymentPill status={order.paymentStatus} />
        </span>
      </div>
      <p className="font-body text-sm text-black/60 mt-2">
        Placed {new Date(order.createdAt).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })} · updates arrive live
      </p>

      {/* ── PROGRESS — black for reached steps, gray ahead ── */}
      {order.status !== "CANCELLED" ? (
        <div className="mt-6 border border-black/10 rounded-xl p-5 md:p-6">
          <div className="flex items-start">
            {steps.map((s, i) => {
              const reached = i <= stepIndex;
              const icons = { RESERVED: "inventory_2", PROCESSING: "pending", FULFILLED: "check_circle" };
              return (
                <div key={s} className="flex-1 flex items-start">
                  {/* Dot plus label */}
                  <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
                    <span
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${reached ? "bg-primary text-white" : "bg-surface text-black/30"}`}
                    >
                      <Icon name={icons[s]} size={22} />
                    </span>
                    <span className={`font-body text-xs md:text-sm text-center ${reached ? "text-black font-bold" : "text-black/40"}`}>
                      {stepLabels[s]}
                    </span>
                  </div>
                  {/* Connector line except after last */}
                  {i < steps.length - 1 && (
                    <span className={`flex-1 h-0.5 mt-5 ${i < stepIndex ? "bg-primary" : "bg-surface"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="mt-6 font-body text-sm text-danger bg-danger/10 rounded-xl p-4 flex items-center gap-2">
          <Icon name="cancel" />
          This order was cancelled. Reserved stock went back to the sellers.
        </p>
      )}

      {/* Items left, payment card right — stacked on phone */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_400px] items-start">
        {/* ── ITEMS — one card, divided rows ── */}
        <ul className="min-w-0 border border-black/10 rounded-xl px-4 md:px-6 divide-y divide-black/10">
          {order.orderItems?.map((it) => (
            <li key={it.id} className="py-4 md:py-5 flex gap-4 items-center min-w-0">
              {/* Thumb with fallback */}
              <span className="relative w-16 h-16 md:w-20 md:h-20 shrink-0 bg-card rounded-xl overflow-hidden">
                {it.product?.imageUrl ? (
                  <img src={it.product.imageUrl} alt={it.product?.name} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-black/25">
                    <Icon name="image" />
                  </span>
                )}
              </span>
              {/* Name, vendor, qty */}
              <span className="flex-1 min-w-0">
                <span className="block font-body font-bold text-base text-black truncate">
                  {it.product?.name || "Item"}
                </span>
                {/* Vendor plus barangay, per item */}
                <span className="flex items-center gap-1 font-body text-xs text-black/60 mt-1 truncate">
                  <Icon name="storefront" size={14} />
                  {it.product?.seller?.name || "-"} · {it.product?.barangay?.name || "-"}
                </span>
                <span className="block font-body text-xs text-black/60 mt-0.5">
                  Qty {it.quantity} × {formatPeso(it.price)}
                </span>
              </span>
              <span className="font-body font-bold text-lg text-black shrink-0">
                {formatPeso(Number(it.price) * it.quantity)}
              </span>
            </li>
          ))}
        </ul>

        {/* ── PAYMENT + DELIVERY ── */}
        <aside className="min-w-0 border border-black/10 rounded-xl p-5 md:p-6">
          <h2 className="heading-body text-xl md:text-2xl text-black">Summary</h2>
          <dl className="mt-5 space-y-4 font-body text-base">
            <div className="flex justify-between gap-2">
              <dt className="text-black/60 flex items-center gap-2">
                <Icon name={order.paymentMethod === "GCASH" ? "account_balance_wallet" : "payments"} size={18} />
                Payment
              </dt>
              <dd className="font-bold text-black">{order.paymentMethod === "GCASH" ? "GCash" : "Cash"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-black/60 flex items-center gap-2">
                <Icon name="local_shipping" size={18} />
                Getting it via
              </dt>
              <dd className="font-bold text-black">{order.deliveryType === "PICKUP" ? "Store pickup" : "Delivery"}</dd>
            </div>
            <hr className="border-black/10" />
            <div className="flex justify-between gap-2 text-lg">
              <dt className="text-black">{order.paymentStatus === "PAID" ? "Total paid" : "Total to pay"}</dt>
              <dd className="font-bold text-2xl text-black">{formatPeso(order.totalAmount)}</dd>
            </div>
          </dl>
          {/* Recheck button for waiting GCash money */}
          {showRecheck && (
            <button
              onClick={recheck}
              disabled={checking}
              className="btn-outline btn-active w-full mt-6 py-3.5 font-body font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {checking ? <span className="spinner" /> : <Icon name="refresh" />}
              {checking ? "Checking..." : "Recheck payment status"}
            </button>
          )}
        </aside>
      </div>
    </div>
  );
};

export default OrderDetail;
