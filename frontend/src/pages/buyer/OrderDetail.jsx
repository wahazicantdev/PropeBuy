import RateOrderItems from "../../components/RateOrderItems.jsx";
import RefundGcashForm from "../../components/RefundGcashForm.jsx";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { OrderPill, PaymentPill } from "../../components/OrderStatus.jsx";
import { fetchOrder, checkPayment, cancelMyOrder, payOrderAgain } from "../../api/order.api.js";
import ConfirmModal from "../../components/ConfirmModal.jsx";
// Report the store behind this order (11-26)
import ReportModal from "../../components/ReportModal.jsx";
import Icon from "../../components/Icon.jsx";
import { formatPeso } from "../../utils/format.js";
// Live tick — socket events refetch this page, no manual refresh
import { useLiveTick } from "../../hooks/useSocket.js";
import { cld } from "../../utils/photos.js";

// Order detail - one order with items, totals, payment recheck
const OrderDetail = () => {
  // Id from URL /orders/:id
  const { id } = useParams();
  // Order state with items
  const [order, setOrder] = useState(null);
  // Loading flags, page plus recheck button
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  // Cancel confirmation modal and its busy flag
  const [askCancel, setAskCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  // Busy flag while a new payment page is prepared
  const [paying, setPaying] = useState(false);

  // New PayMongo page for an unpaid order (E2E #421)
  const payAgain = async () => {
    setPaying(true);
    try {
      const res = await payOrderAgain(order.id);
      if (res.data?.paymentUrl) {
        // Same-tab trip, PayMongo brings the buyer back here
        localStorage.setItem("propebuy_last_order", String(order.id));
        window.location.href = res.data.paymentUrl;
        return;
      }
      // The old page went through after all
      toast.success(res.message || "Payment confirmed");
      const fresh = await fetchOrder(order.id);
      setOrder(fresh.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not open the payment page");
    }
    setPaying(false);
  };

  // Buyer cancels while the order is still reserved
  const cancelOrder = async () => {
    setCancelling(true);
    try {
      const res = await cancelMyOrder(order.id);
      toast.success(res.message);
      setOrder((o) => ({ ...o, status: "CANCELLED" }));
      setAskCancel(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not cancel this order");
    } finally {
      setCancelling(false);
    }
  };

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
    order.paymentMethod === "GCASH" && order.paymentStatus === "PENDING" && order.status !== "CANCELLED";
  // Pay now — open order with an online part still unpaid
  const showPayAgain =
    order.status !== "CANCELLED" &&
    ((order.paymentMethod === "GCASH" && order.paymentStatus === "PENDING") ||
      (order.paymentMethod === "CASH" && order.deliveryFeeStatus === "PENDING"));

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
          {/* Refund state — sent with its reference, or still on its way (E2E #441) */}
          {(() => {
            const refunds = order.earnings || [];
            const total = refunds.reduce((s, e) => s + Number(e.itemsAmount) + Number(e.deliveryFee), 0);
            const sent = refunds.length > 0 && refunds.every((e) => e.status === "REFUNDED");
            if (sent) {
              const refs = refunds.map((e) => e.refundReference).filter(Boolean).join(", ");
              return ` Your refund of ₱${total.toFixed(2)} was sent. Reference ${refs}.`;
            }
            if (refunds.length > 0) return ` PropeBuy will send your ₱${total.toFixed(2)} back to your GCash. You get a notice with the reference number.`;
            return (order.paymentStatus === "PAID" && order.paymentMethod === "GCASH") || order.deliveryFeeStatus === "PAID"
              ? " Your online payment will be refunded by PropeBuy."
              : "";
          })()}
        </p>
      )}

      {/* Where the refund goes — asked only while a refund is waiting */}
      {order.status === "CANCELLED" && (
        <RefundGcashForm
          order={order}
          onSaved={(masked) =>
            setOrder({
              ...order,
              earnings: order.earnings.map((e) => (e.status === "REFUND_DUE" ? { ...e, refundGcash: masked } : e)),
            })
          }
        />
      )}

      {/* Cancel — only before the seller starts processing */}
      {order.status === "RESERVED" && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => setAskCancel(true)}
            className="font-body text-sm font-bold text-danger underline flex items-center gap-1"
          >
            <Icon name="cancel" size={18} /> Cancel order
          </button>
        </div>
      )}
      {/* Report the store — any order, for scams, no-shows or rude sellers */}
      <div className="mt-3 flex justify-end">
        <button
          onClick={() => setReportOpen(true)}
          className="font-body text-xs text-black/60 hover:text-black underline flex items-center gap-1"
        >
          <Icon name="flag" size={16} /> Report a problem with this store
        </button>
      </div>
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        orderId={order.id}
        title={`Report a problem with order #${order.id}`}
      />
      <ConfirmModal
        open={askCancel}
        title="Cancel this order?"
        message="The items go back to the seller's stock. If you already paid online, PropeBuy refunds you."
        confirmLabel="Yes, cancel order"
        cancelLabel="Keep order"
        busy={cancelling}
        onConfirm={cancelOrder}
        onCancel={() => setAskCancel(false)}
      />

      {/* Ratings — required on fulfilled orders before the next checkout */}
      {order.status === "FULFILLED" && (
        <RateOrderItems
          order={order}
          onRated={(itemId, review) =>
            setOrder((o) => ({
              ...o,
              orderItems: o.orderItems.map((it) => (it.id === itemId ? { ...it, review } : it)),
            }))
          }
        />
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
                  <img src={cld(it.product.imageUrl, 200)} alt={it.product?.name} className="absolute inset-0 w-full h-full object-cover" />
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
                  {/* Picked option, copied at checkout */}
                  {it.variantName ? ` (${it.variantName})` : ""}
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
            {/* Delivery snapshot — address and fee as placed */}
            {order.deliveryType === "DELIVERY" && order.deliveryAddress && (
              <div className="flex justify-between gap-4">
                <dt className="text-black/60 shrink-0">Deliver to</dt>
                <dd className="font-bold text-black text-right break-words">{order.deliveryAddress}</dd>
              </div>
            )}
            {Number(order.deliveryFee) > 0 && (
              <div className="flex justify-between gap-2">
                <dt className="text-black/60">Delivery fee</dt>
                <dd className="font-bold text-black">
                  {formatPeso(order.deliveryFee)}{" "}
                  <span className={`font-normal text-xs ${order.deliveryFeeStatus === "PAID" ? "text-black/60" : "text-danger"}`}>
                    {order.deliveryFeeStatus === "PAID" ? "paid" : "not paid yet"}
                  </span>
                </dd>
              </div>
            )}
            <hr className="border-black/10" />
            <div className="flex justify-between gap-2 text-lg">
              <dt className="text-black">{order.paymentStatus === "PAID" ? "Total paid" : "Total to pay"}</dt>
              <dd className="font-bold text-2xl text-black">{formatPeso(Number(order.totalAmount) + Number(order.deliveryFee || 0))}</dd>
            </div>
          </dl>
          {/* Recheck button for waiting GCash money */}
          {/* Unfinished payment — plain words plus a way to finish it */}
          {showPayAgain && (
            <>
              <p className="mt-6 font-body text-sm text-danger bg-danger/10 rounded-xl p-3">
                {order.paymentMethod === "GCASH"
                  ? "Your GCash payment is not done yet. The seller starts once it goes through."
                  : "The delivery fee is not paid yet. The seller starts once it goes through."}
              </p>
              <button
                onClick={payAgain}
                disabled={paying}
                className="btn-primary btn-active w-full mt-3 py-3.5 font-body font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {paying ? <span className="spinner" /> : <Icon name="payments" />}
                {paying ? "Opening payment page..." : "Pay now"}
              </button>
            </>
          )}
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
