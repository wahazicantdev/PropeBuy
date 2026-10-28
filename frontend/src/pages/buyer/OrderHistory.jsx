import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { OrderPill, PaymentPill } from "../../components/OrderStatus.jsx";
import { fetchMyOrders } from "../../api/order.api.js";

// Order history - buyer past orders with status filter
const OrderHistory = () => {
  // Full list from backend, newest first
  const [orders, setOrders] = useState([]);
  // Status filter, empty means all
  const [filter, setFilter] = useState("");
  // Loading flag
  const [loading, setLoading] = useState(true);

  // Filter chips matching the documented enum
  const filters = ["", "RESERVED", "PROCESSING", "FULFILLED", "CANCELLED"];
  const filterLabels = {
    "": "All",
    RESERVED: "Reserved",
    PROCESSING: "Processing",
    FULFILLED: "Fulfilled",
    CANCELLED: "Cancelled",
  };

  // Load once on mount
  useEffect(() => {
    fetchMyOrders()
      .then((res) => setOrders(res.data || []))
      .catch(() => toast.error("Failed to load orders"))
      .finally(() => setLoading(false));
  }, []);

  // Client-side filter, backend has no status query here
  const shown = filter ? orders.filter((o) => o.status === filter) : orders;

  // Date helper, short local format
  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="page-enter">
      {/* Bold header */}
      <h1 className="font-header font-bold text-2xl text-gray-900">
        My orders
      </h1>
      <p className="font-body text-sm text-passive mt-1">
        Track every purchase in one place.
      </p>
      {/* Filter chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`btn-active font-body text-xs rounded-full px-4 py-2 border ${filter === f ? "bg-primary text-white border-primary" : "border-gray-200 text-passive"}`}
          >
            {filterLabels[f]}
          </button>
        ))}
      </div>
      {/* List */}
      {loading ? (
        <p className="text-center py-16 font-body text-passive">Loading...</p>
      ) : shown.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-header font-bold text-lg text-gray-900">
            No orders here
          </p>
          <p className="font-body text-sm text-passive mt-1">
            Your placed orders will show up.
          </p>
          <Link
            to="/browse"
            className="btn-active inline-block mt-6 bg-primary text-white font-body px-6 py-3 rounded-lg"
          >
            Browse goods
          </Link>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {shown.map((o) => (
            // Whole card opens the detail
            <Link
              key={o.id}
              to={`/orders/${o.id}`}
              className="block border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              {/* Top row - id plus date */}
              <div className="flex justify-between font-body text-sm">
                <span className="font-bold text-gray-900">Order #{o.id}</span>
                <span className="text-passive">{fmtDate(o.createdAt)}</span>
              </div>
              {/* Item line - first product plus overflow count */}
              <div className="mt-2 flex items-center gap-3 min-w-0">
                {/* Thumb with fallback, first product image */}
                <div className="w-12 h-12 shrink-0 bg-gray-50 rounded-lg overflow-hidden">
                  {o.orderItems?.[0]?.product?.imageUrl ? (
                    <img
                      src={o.orderItems[0].product.imageUrl}
                      alt={o.orderItems[0].product.name}
                      className="object-cover"
                      style={{ width: "100%", height: "100%" }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-body text-xs text-passive text-center leading-tight">
                      No photo
                    </div>
                  )}
                </div>
                <p className="flex-1 min-w-0 font-body text-sm text-gray-700 truncate">
                  {o.orderItems?.[0]?.product?.name || "Items"}
                  {o.orderItems?.length > 1
                    ? ` +${o.orderItems.length - 1} more`
                    : ""}
                </p>
              </div>
              {/* Bottom row - total plus pills */}
              <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                <span className="font-body font-bold text-primary">
                  P{Number(o.totalAmount).toLocaleString()}
                </span>
                <span className="flex gap-2">
                  <OrderPill status={o.status} />
                  <PaymentPill status={o.paymentStatus} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
