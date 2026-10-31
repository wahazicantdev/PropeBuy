import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { OrderPill, PaymentPill } from "../../components/OrderStatus.jsx";
import { fetchMyOrders } from "../../api/order.api.js";
import Icon from "../../components/Icon.jsx";
import { formatPeso } from "../../utils/format.js";
// Live tick — socket events refetch this page, no manual refresh
import { useLiveTick } from "../../hooks/useSocket.js";

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
  // Bumps when a seller moves an order or a payment lands
  const live = useLiveTick();

  useEffect(() => {
    fetchMyOrders()
      .then((res) => setOrders(res.data || []))
      .catch(() => toast.error("Failed to load orders"))
      .finally(() => setLoading(false));
  }, [live]);

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
      {/* Breadcrumb */}
      <nav className="font-body text-sm text-black/60 flex items-center gap-1" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-black">Home</Link>
        <Icon name="chevron_right" size={16} />
        <span className="text-black">My orders</span>
      </nav>
      <h1 className="mt-4 text-3xl md:text-4xl text-black">My orders</h1>
      <p className="font-body text-sm text-black/60 mt-2">
        Track every purchase in one place. Updates arrive live.
      </p>

      {/* Filter chips — black when active, gray pills otherwise */}
      <div className="mt-5 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`btn-active font-body text-sm rounded-full px-5 py-2 ${filter === f ? "bg-primary text-white" : "bg-surface text-black/60 hover:text-black"}`}
          >
            {filterLabels[f]}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <span className="spinner" />
        </div>
      ) : shown.length === 0 ? (
        <div className="py-20 text-center">
          <span className="inline-flex w-20 h-20 rounded-full bg-surface items-center justify-center">
            <Icon name="receipt_long" size={36} />
          </span>
          <p className="mt-5 font-header text-xl text-black">No orders here</p>
          <p className="font-body text-sm text-black/60 mt-1">
            Your placed orders will show up here.
          </p>
          <Link to="/browse" className="btn-primary btn-active inline-block mt-6 px-12 py-3.5 font-body font-medium">
            Shop now
          </Link>
        </div>
      ) : (
        // One bordered card, divided rows — same language as the cart
        <ul className="mt-6 border border-black/10 rounded-xl px-4 md:px-6 divide-y divide-black/10">
          {shown.map((o) => (
            <li key={o.id}>
              {/* Whole row opens the detail */}
              <Link to={`/orders/${o.id}`} className="py-4 md:py-5 flex gap-4 items-center min-w-0 group">
                {/* Thumb — first product image */}
                <span className="relative w-16 h-16 md:w-20 md:h-20 shrink-0 bg-card rounded-xl overflow-hidden">
                  {o.orderItems?.[0]?.product?.imageUrl ? (
                    <img
                      src={o.orderItems[0].product.imageUrl}
                      alt={o.orderItems[0].product.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <span className="absolute inset-0 flex items-center justify-center text-black/25">
                      <Icon name="image" />
                    </span>
                  )}
                </span>
                {/* Middle — id, items, pills */}
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2 flex-wrap">
                    <span className="font-body font-bold text-base text-black">Order #{o.id}</span>
                    <span className="font-body text-xs text-black/60">{fmtDate(o.createdAt)}</span>
                  </span>
                  <span className="block font-body text-sm text-black/60 truncate mt-0.5">
                    {o.orderItems?.[0]?.product?.name || "Items"}
                    {o.orderItems?.length > 1 ? ` +${o.orderItems.length - 1} more` : ""}
                  </span>
                  <span className="mt-2 flex gap-2 flex-wrap">
                    <OrderPill status={o.status} />
                    <PaymentPill status={o.paymentStatus} />
                  </span>
                </span>
                {/* Right — total and chevron */}
                <span className="flex items-center gap-2 shrink-0">
                  <span className="font-body font-bold text-lg md:text-xl text-black">
                    {formatPeso(o.totalAmount)}
                  </span>
                  <Icon name="chevron_right" className="text-black/30 group-hover:text-black hidden sm:block" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OrderHistory;
