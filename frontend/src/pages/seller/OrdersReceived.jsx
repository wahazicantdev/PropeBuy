import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
// House pills — same ones the buyer pages use
import { OrderPill, PaymentPill } from "../../components/OrderStatus.jsx";
import Spinner from "../../components/Spinner.jsx";
import { fetchSellerOrders } from "../../api/order.api.js";

// OrdersReceived — orders touching this seller, newest first
const OrdersReceived = () => {
  // Full order list — backend already filters items to this seller's own
  const [orders, setOrders] = useState([]);
  // Active chip — ALL / RESERVED / PROCESSING / FULFILLED / CANCELLED
  const [filter, setFilter] = useState("ALL");
  // Loading flag until fetch settles
  const [loading, setLoading] = useState(true);

  // Load orders once — no polling here, socket pings arrive in Phase F
  useEffect(() => {
    fetchSellerOrders()
      .then((res) => setOrders(res.data || []))
      .catch((err) => {
        const msg =
          err.response?.data?.errors?.[0]?.message ||
          err.response?.data?.message ||
          "Failed to load orders";
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── DATE HELPER ──
  // Backend sends ISO strings — show short local style
  const formatDate = (iso) =>
    new Date(iso).toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  // ── FILTER COUNTS ──
  // Client-side, same pattern as My Products chips — enums drive it
  const counts = {
    ALL: orders.length,
    RESERVED: orders.filter((o) => o.status === "RESERVED").length,
    PROCESSING: orders.filter((o) => o.status === "PROCESSING").length,
    FULFILLED: orders.filter((o) => o.status === "FULFILLED").length,
    CANCELLED: orders.filter((o) => o.status === "CANCELLED").length,
  };
  // Visible rows follow the active chip
  const filtered =
    filter === "ALL" ? orders : orders.filter((o) => o.status === filter);

  // Loading state
  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center gap-3 font-body text-sm text-passive">
        <Spinner />
        Loading orders...
      </div>
    );
  }

  return (
    <div className="page-enter">
      {/* Header */}
      <h1 className="font-header text-xl md:text-2xl text-gray-900">
        Orders Received
      </h1>
      <p className="font-body text-sm text-passive mt-1">
        Every order containing your products, newest first.
      </p>

      {/* Status chips — counts live inside, tap to switch views */}
      <div className="flex gap-2 flex-wrap mt-4">
        {[
          { key: "ALL", label: "All" },
          { key: "RESERVED", label: "Reserved" },
          { key: "PROCESSING", label: "Processing" },
          { key: "FULFILLED", label: "Fulfilled" },
          { key: "CANCELLED", label: "Cancelled" },
        ].map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            className={`font-body text-xs font-bold rounded-full px-3 py-1.5 transition-colors ${
              filter === c.key
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {c.label} ({counts[c.key]})
          </button>
        ))}
      </div>

      {/* Empty states — honest for both no-orders and no-matches */}
      {orders.length === 0 ? (
        <div className="mt-10 border border-dashed border-gray-300 rounded-xl p-10 text-center">
          <p className="font-header text-lg text-gray-900">No orders yet</p>
          <p className="font-body text-sm text-passive mt-1">
            When a buyer reserves your products, it shows up here.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 border border-dashed border-gray-300 rounded-xl p-10 text-center">
          <p className="font-body text-sm text-passive">
            Nothing in this filter — try another one.
          </p>
        </div>
      ) : (
        // Rows — whole row is the link, big tap target on phone
        <ul className="mt-6 flex flex-col gap-3">
          {filtered.map((o) => {
            // Received list already contains ONLY this seller's items
            const itemCount = o.orderItems.length;
            const subtotal = o.orderItems.reduce(
              (s, i) => s + parseFloat(i.price) * i.quantity,
              0,
            );
            return (
              <li key={o.id}>
                <Link
                  to={`/seller/orders/${o.id}`}
                  className="block border border-gray-100 rounded-xl p-3 md:p-4 hover:border-primary/40 transition-colors overflow-hidden"
                >
                  {/* Top line — order id + date + pills */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-body font-bold text-sm text-gray-900">
                      Order #{o.id}
                    </span>
                    <span className="font-body text-xs text-passive">
                      {formatDate(o.createdAt)}
                    </span>
                    <span className="flex gap-2 ml-auto">
                      <OrderPill status={o.status} />
                      <PaymentPill status={o.paymentStatus} />
                    </span>
                  </div>
                  {/* Buyer + items summary — min-w-0, wraps never overflow */}
                  <div className="min-w-0 mt-2">
                    <p className="font-body text-sm text-gray-900 truncate">
                      {o.buyer?.name} · {o.deliveryType === "PICKUP" ? "Pickup" : "Delivery"}
                    </p>
                    <p className="font-body text-xs text-passive truncate mt-0.5">
                      {o.orderItems[0]?.product?.name}
                      {itemCount > 1 ? ` + ${itemCount - 1} more` : ""}
                    </p>
                  </div>
                  {/* Seller subtotal — your slice only */}
                  <p className="font-body font-bold text-sm text-primary mt-2">
                    Your items: ₱{subtotal.toFixed(2)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default OrdersReceived;