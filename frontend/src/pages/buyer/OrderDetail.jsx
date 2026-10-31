import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { OrderPill, PaymentPill } from "../../components/OrderStatus.jsx";
import { fetchOrder, checkPayment } from "../../api/order.api.js";
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
      <p className="text-center py-16 font-body text-passive">Loading...</p>
    );
  if (!order)
    return (
      <p className="text-center py-16 font-body text-passive">
        Order not found.{" "}
        <Link to="/orders" className="text-primary">
          Back to orders
        </Link>
      </p>
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
      {/* Back plus id header */}
      <Link
        to="/orders"
        className="font-body text-sm text-passive hover:text-primary"
      >
        Back to orders
      </Link>
      <div className="mt-2 flex items-center justify-between gap-2 flex-wrap">
        <h1 className="font-header font-bold text-2xl text-gray-900">
          Order #{order.id}
        </h1>
        <span className="flex gap-2">
          <OrderPill status={order.status} />
          <PaymentPill status={order.paymentStatus} />
        </span>
      </div>
      {/* Progress steps, hidden for cancelled orders */}
      {order.status !== "CANCELLED" ? (
        <div className="mt-4 flex items-center gap-1">
          {steps.map((s, i) => (
            <div key={s} className="flex-1 flex items-center gap-1">
              {/* Dot plus label, reached steps go primary */}
              <div className="flex flex-col items-center gap-1 flex-1">
                <span
                  className={`w-6 h-6 rounded-full font-body text-xs flex items-center justify-center ${i <= stepIndex ? "bg-primary text-white" : "bg-gray-100 text-passive"}`}
                >
                  {i + 1}
                </span>
                <span
                  className={`font-body text-xs ${i <= stepIndex ? "text-primary font-bold" : "text-passive"}`}
                >
                  {stepLabels[s]}
                </span>
              </div>
              {/* Connector line except after last */}
              {i < steps.length - 1 && (
                <span
                  className={`flex-1 h-0.5 mb-5 ${i < stepIndex ? "bg-primary" : "bg-gray-100"}`}
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 font-body text-sm text-danger">
          This order was cancelled. Reserved stock went back to the sellers.
        </p>
      )}
      {/* Items card */}
      <div className="mt-4 border border-gray-100 rounded-xl p-4 space-y-3">
        {order.orderItems?.map((it) => (
          <div key={it.id} className="flex gap-3">
            {/* Thumb with fallback */}
            <div className="w-14 h-14 shrink-0 bg-gray-50 rounded-lg overflow-hidden">
              {it.product?.imageUrl ? (
                <img
                  src={it.product.imageUrl}
                  alt={it.product?.name}
                  className="object-cover"
                  style={{ width: "100%", height: "100%" }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-body text-xs text-passive">
                  No photo
                </div>
              )}
            </div>
            {/* Name, qty, line total */}
            <div className="flex-1 min-w-0 flex justify-between gap-2">
              <div className="min-w-0">
                <p className="font-body font-bold text-sm text-gray-900 truncate">
                  {it.product?.name || "Item"}
                </p>
                {/* Vendor plus barangay, per item */}
                <p className="font-body text-xs text-passive mt-1 truncate">
                  {it.product?.seller?.name || "-"} ·{" "}
                  {it.product?.barangay?.name || "-"}
                </p>
                <p className="font-body text-xs text-passive mt-1">
                  Qty {it.quantity}
                </p>
              </div>
              <p className="font-body font-bold text-sm text-primary shrink-0">
                P{(Number(it.price) * it.quantity).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
        {/* Total row */}
        <div className="flex justify-between border-t border-gray-100 pt-3 font-body text-sm">
          <span className="text-passive">Total paid or to pay</span>
          <span className="font-bold text-primary text-lg">
            P{Number(order.totalAmount).toLocaleString()}
          </span>
        </div>
      </div>
      {/* Payment plus delivery card */}
      <div className="mt-3 border border-gray-100 rounded-xl p-4 font-body text-sm space-y-2">
        <div className="flex justify-between">
          <span className="text-passive">Payment</span>
          <span className="text-gray-900 font-bold">
            {order.paymentMethod === "GCASH" ? "GCash" : "Cash"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-passive">Getting it via</span>
          <span className="text-gray-900 font-bold">
            {order.deliveryType === "PICKUP" ? "Store pickup" : "Delivery"}
          </span>
        </div>
        {/* Recheck button for waiting GCash money */}
        {showRecheck && (
          <button
            onClick={recheck}
            disabled={checking}
            className="w-full mt-2 border border-primary text-primary py-3 rounded-lg disabled:opacity-50"
          >
            {checking ? "Checking..." : "Recheck Payment Status"}
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderDetail;
