import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
// Auth store — splits own items from other sellers' items
import { useAuthStore } from "../../stores/auth.store.js";
// House pills + modal + spinner
import { OrderPill, PaymentPill } from "../../components/OrderStatus.jsx";
import ConfirmModal from "../../components/ConfirmModal.jsx";
import Spinner from "../../components/Spinner.jsx";
import {
  fetchOrder,
  updateOrderStatus,
  markCashPaid,
} from "../../api/order.api.js";

// ── ACTION MAP ──
// Frontend guides transitions — buttons only offer sensible next moves.
// CANCELLED is dangerous (restores stock, whole order) → confirm modal
const ACTIONS = {
  RESERVED: [
    { label: "Start processing", status: "PROCESSING", kind: "primary" },
    { label: "Cancel order", status: "CANCELLED", kind: "danger" },
  ],
  PROCESSING: [
    { label: "Mark fulfilled", status: "FULFILLED", kind: "primary" },
    { label: "Cancel order", status: "CANCELLED", kind: "danger" },
  ],
  FULFILLED: [], // done — no buttons, honest note instead
  CANCELLED: [], // dead — no buttons, honest note instead
};

// OrderDetailSeller — full order view + status + payment actions
const OrderDetailSeller = () => {
  // Route id + nav for honest bounces
  const { id } = useParams();
  const navigate = useNavigate();
  // Live user — item split + seller checks
  const { user } = useAuthStore();
  // The order object
  const [order, setOrder] = useState(null);
  // Loading flag
  const [loading, setLoading] = useState(true);
  // Busy tracks WHICH status action runs — disables buttons while any does
  const [busy, setBusy] = useState(null);
  // Separate busy for the cash-payment action
  const [busyPay, setBusyPay] = useState(false);
  // Modal open states — cancel + cash paid
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [confirmPaid, setConfirmPaid] = useState(false);

  // Load order — reusable so actions refresh after success
  const load = () => {
    setLoading(true);
    fetchOrder(id)
      .then((res) => setOrder(res.data))
      .catch((err) => {
        // 403 foreign order or 404 missing — bounce home honestly
        const msg = err.response?.data?.message || "Order not found";
        toast.error(msg);
        navigate("/seller/orders", { replace: true });
      })
      .finally(() => setLoading(false));
  };

  // First load on mount + on id change
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Run a status action — direct for safe moves, modal path for cancel
  const handleAction = async (status) => {
    setBusy(status);
    try {
      const res = await updateOrderStatus(id, status);
      // Exact backend message: "Order status updated to X"
      toast.success(res.message || `Order marked ${status}`);
      // Refresh — pills, notes, and actions follow backend truth
      await load();
    } catch (err) {
      const msg = err.response?.data?.message || "Status update failed";
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  };

  // Confirm cash received — CASH orders only, buyer pings live
  const handleCashPaid = async () => {
    setBusyPay(true);
    try {
      const res = await markCashPaid(id);
      toast.success(res.message || "Payment marked as received");
      // Refresh — pill flips PAID, button disappears
      await load();
    } catch (err) {
      const msg = err.response?.data?.message || "Payment update failed";
      toast.error(msg);
    } finally {
      setBusyPay(false);
    }
  };

  // Loading state
  if (loading || !order) {
    return (
      <div className="py-16 flex items-center justify-center gap-3 font-body text-sm text-passive">
        <Spinner />
        Loading order...
      </div>
    );
  }

  // ── ITEM SPLIT ──
  // Shared detail endpoint shows ALL items — own items drive the
  // subtotal, other sellers' lines stay visible but marked
  const ownItems = order.orderItems.filter(
    (i) => i.product.sellerId === user.id,
  );
  const otherItems = order.orderItems.filter(
    (i) => i.product.sellerId !== user.id,
  );
  // Seller subtotal — own lines only
  const ownSubtotal = ownItems.reduce(
    (s, i) => s + parseFloat(i.price) * i.quantity,
    0,
  );
  // Multi-seller warning for the cancel modal
  const hasOtherSellers = otherItems.length > 0;
  // Cash-paid button — ONLY for cash orders awaiting money
  const showCashPaid =
    order.paymentMethod === "CASH" && order.paymentStatus === "PENDING";

  return (
    <div className="page-enter">
      {/* Back link — one tap to the list */}
      <Link
        to="/seller/orders"
        className="font-body text-xs text-passive hover:text-primary inline-block mb-2"
      >
        Back to Orders Received
      </Link>

      {/* Header — id left, LABELED pills right so they never confuse */}
      <div className="flex items-start gap-2 flex-wrap">
        <h1 className="font-header text-xl md:text-2xl text-gray-900">
          Order #{order.id}
        </h1>
        <span className="flex gap-3 ml-auto">
          {/* Labeled pill group — order status */}
          <span className="flex flex-col items-end gap-0.5">
            <span className="font-body text-xs text-passive">Order status</span>
            <OrderPill status={order.status} />
          </span>
          {/* Labeled pill group — payment */}
          <span className="flex flex-col items-end gap-0.5">
            <span className="font-body text-xs text-passive">Payment</span>
            <PaymentPill status={order.paymentStatus} />
          </span>
        </span>
      </div>
      <p className="font-body text-sm text-passive mt-1">
        Placed{" "}
        {new Date(order.createdAt).toLocaleString("en-PH", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}
      </p>

      {/* ── YOUR ITEMS ── */}
      <div className="mt-6 border border-black/10 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-black/10 bg-surface">
          <p className="font-body font-bold text-sm text-gray-900">
            Your items
          </p>
        </div>
        <ul className="divide-y divide-black/10">
          {ownItems.map((i) => (
            <li
              key={i.id}
              className="p-3 md:p-4 flex gap-3 items-center overflow-hidden"
            >
              {/* Thumb */}
              {i.product.imageUrl ? (
                <img
                  src={i.product.imageUrl}
                  alt={i.product.name}
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center font-header text-gray-400">
                  {i.product.name.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Name + qty */}
              <div className="min-w-0 flex-1">
                <p className="font-body font-bold text-sm text-gray-900 line-clamp-2">
                  {i.product.name}
                </p>
                <p className="font-body text-xs text-passive mt-0.5">
                  {i.quantity} × ₱{parseFloat(i.price).toFixed(2)}
                </p>
              </div>
              {/* Line total */}
              <p className="font-body font-bold text-sm text-gray-900 shrink-0">
                ₱{(parseFloat(i.price) * i.quantity).toFixed(2)}
              </p>
            </li>
          ))}
        </ul>
        {/* Subtotal line — own items only */}
        <div className="px-4 py-3 border-t border-black/10 flex items-center justify-between">
          <span className="font-body text-sm text-passive">
            Your items subtotal
          </span>
          <span className="font-body font-bold text-sm text-primary">
            ₱{ownSubtotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* ── OTHER SELLERS' ITEMS (shared orders only) ── */}
      {hasOtherSellers && (
        <div className="mt-3 border border-black/10 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-black/10 bg-surface flex items-center justify-between gap-2">
            <p className="font-body font-bold text-sm text-gray-500">
              Other sellers' items
            </p>
            <span className="bg-gray-100 text-gray-500 font-body text-xs font-bold rounded-full px-2 py-0.5">
              Shared order
            </span>
          </div>
          <ul className="divide-y divide-black/10">
            {otherItems.map((i) => (
              <li
                key={i.id}
                className="p-3 md:p-4 flex gap-3 items-center opacity-70"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-body text-sm text-gray-700 truncate">
                    {i.product.name}
                  </p>
                  <p className="font-body text-xs text-passive mt-0.5">
                    {i.quantity} × ₱{parseFloat(i.price).toFixed(2)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          {/* Honesty note — order total includes them */}
          <div className="px-4 py-3 border-t border-black/10 flex items-center justify-between">
            <span className="font-body text-xs text-passive">
              Order total (all sellers)
            </span>
            <span className="font-body font-bold text-sm text-gray-700">
              ₱{parseFloat(order.totalAmount).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* ── BUYER + PAYMENT + DELIVERY ── */}
      <div className="mt-3 border border-black/10 rounded-xl p-4 grid gap-4 sm:grid-cols-3">
        {/* Buyer contact — coordination happens here, no address field exists */}
        <div className="min-w-0">
          <p className="font-body text-xs font-bold text-passive uppercase tracking-wide">
            Buyer
          </p>
          <p className="font-body font-bold text-sm text-gray-900 mt-1 truncate">
            {order.buyer?.name}
          </p>
          <p className="font-body text-xs text-passive truncate">
            {order.buyer?.email}
          </p>
        </div>
        {/* Delivery — enum labels */}
        <div>
          <p className="font-body text-xs font-bold text-passive uppercase tracking-wide">
            Handover
          </p>
          <p className="font-body font-bold text-sm text-gray-900 mt-1">
            {order.deliveryType === "PICKUP" ? "Pickup / meet-up" : "Delivery"}
          </p>
          <p className="font-body text-xs text-passive">
            {order.deliveryType === "PICKUP"
              ? "Coordinate time and place with the buyer"
              : "Coordinate delivery with the buyer"}
          </p>
        </div>
        {/* Payment — method, honest pending notes, cash action lives here */}
        <div>
          <p className="font-body text-xs font-bold text-passive uppercase tracking-wide">
            Payment
          </p>
          <p className="font-body font-bold text-sm text-gray-900 mt-1">
            {order.paymentMethod === "GCASH" ? "GCash" : "Cash"}
          </p>
          {order.paymentMethod === "GCASH" &&
            order.paymentStatus === "PENDING" && (
              <p className="font-body text-xs text-danger mt-0.5">
                Buyer has not completed GCash payment yet
              </p>
            )}
          {order.paymentMethod === "CASH" &&
            order.paymentStatus === "PENDING" && (
              <p className="font-body text-xs text-passive mt-0.5">
                Collect on{" "}
                {order.deliveryType === "PICKUP" ? "pickup" : "delivery"}
              </p>
            )}
          {/* Cash action — contextual, inside the payment card */}
          {showCashPaid && (
            <button
              onClick={() => setConfirmPaid(true)}
              disabled={busyPay || busy !== null}
              className="btn-primary rounded-full px-3 py-2 font-body text-xs font-bold mt-3 disabled:opacity-50 flex items-center gap-2"
            >
              {busyPay && <Spinner />}
              {busyPay ? "Confirming..." : "Mark payment as received"}
            </button>
          )}
        </div>
      </div>

      {/* ── STATUS ACTIONS ── */}
      <div className="mt-6">
        {ACTIONS[order.status]?.length > 0 ? (
          <div className="flex gap-3 flex-wrap">
            {ACTIONS[order.status].map((a) => (
              <button
                key={a.status}
                // Any action running blocks all buttons
                disabled={busy !== null || busyPay}
                onClick={() =>
                  a.status === "CANCELLED"
                    ? setConfirmCancel(true)
                    : handleAction(a.status)
                }
                className={
                  a.kind === "danger"
                    ? "rounded-full px-4 py-2.5 font-body text-sm font-bold text-danger border border-danger/30 hover:bg-danger/10 disabled:opacity-50 flex items-center gap-2"
                    : "btn-primary rounded-full px-4 py-2.5 font-body text-sm font-bold disabled:opacity-50 flex items-center gap-2"
                }
              >
                {busy === a.status && <Spinner />}
                {busy === a.status ? "Updating..." : a.label}
              </button>
            ))}
          </div>
        ) : (
          // Terminal states — plain honest note, no fake buttons
          <p className="font-body text-sm text-passive border border-black/10 rounded-xl p-4">
            {order.status === "FULFILLED"
              ? "This order is complete — nothing left to do."
              : "This order was cancelled. Reserved stock went back automatically."}
          </p>
        )}
      </div>

      {/* Cancel confirm — house modal standard: portal + blur + pop */}
      <ConfirmModal
        open={confirmCancel}
        title="Cancel this order?"
        message={
          hasOtherSellers
            ? `This cancels the WHOLE order #${order.id} — including other sellers' items — and restores all reserved stock. This cannot be undone.`
            : `Reserved stock for order #${order.id} goes back automatically. This cannot be undone.`
        }
        confirmLabel="Cancel order"
        cancelLabel="Keep order"
        busy={busy !== null}
        onConfirm={() => {
          setConfirmCancel(false);
          handleAction("CANCELLED");
        }}
        onCancel={() => setConfirmCancel(false)}
      />

      {/* Cash-paid confirm — irreversible money state, same standard */}
      <ConfirmModal
        open={confirmPaid}
        title="Mark payment as received?"
        message={`Confirm the buyer paid order #${order.id} in cash. The buyer gets notified instantly. This cannot be undone.`}
        confirmLabel="Yes, payment received"
        cancelLabel="Not yet"
        busy={busyPay}
        onConfirm={() => {
          setConfirmPaid(false);
          handleCashPaid();
        }}
        onCancel={() => setConfirmPaid(false)}
      />
    </div>
  );
};

export default OrderDetailSeller;