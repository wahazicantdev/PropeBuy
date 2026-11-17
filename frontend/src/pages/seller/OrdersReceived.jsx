import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
// House pills — same ones the buyer pages use
import { OrderPill, PaymentPill } from "../../components/OrderStatus.jsx";
import Spinner from "../../components/Spinner.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import FilterChips from "../../components/FilterChips.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Icon from "../../components/Icon.jsx";
import { fetchSellerOrders } from "../../api/order.api.js";
import { formatPeso } from "../../utils/format.js";
// Live tick — socket events refetch this page, no manual refresh
import { useLiveTick } from "../../hooks/useSocket.js";

// Short local date, e.g. "Nov 15, 3:04 PM"
const formatDate = (iso) =>
  new Date(iso).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

// This seller's slice of an order — the list already holds only their items
const subtotal = (o) => o.orderItems.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);

// Items line, e.g. "Sardines Pack + 2 more"
const itemsLine = (o) =>
  `${o.orderItems[0]?.product?.name || "Item"}${o.orderItems[0]?.variantName ? ` (${o.orderItems[0].variantName})` : ""}${o.orderItems.length > 1 ? ` + ${o.orderItems.length - 1} more` : ""}`;

// OrdersReceived — orders touching this seller, newest first
const OrdersReceived = () => {
  const [orders, setOrders] = useState([]);
  // Active chip — ALL / RESERVED / PROCESSING / FULFILLED / CANCELLED
  const [filter, setFilter] = useState("ALL");
  // Order number or buyer name search
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  // Bumps on new_order — fresh orders appear without a refresh
  const live = useLiveTick();

  useEffect(() => {
    fetchSellerOrders()
      .then((res) => setOrders(res.data || []))
      .catch((err) =>
        toast.error(err.response?.data?.errors?.[0]?.message || err.response?.data?.message || "Failed to load orders"),
      )
      .finally(() => setLoading(false));
  }, [live]);

  // Counts per status for the chips
  const count = (s) => orders.filter((o) => o.status === s).length;
  // Visible rows: status chip, then search
  const q = query.trim().toLowerCase().replace(/^#/, "");
  const filtered = orders.filter(
    (o) =>
      (filter === "ALL" || o.status === filter) &&
      (!q || String(o.id).includes(q) || (o.buyer?.name || "").toLowerCase().includes(q)),
  );

  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center gap-3 font-body text-sm text-passive">
        <Spinner /> Loading orders...
      </div>
    );
  }

  return (
    <div className="page-enter">
      <PageHeader title="Orders" subtitle="Every order with your products, newest first. Updates arrive live." />

      {/* Status chips and search */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <FilterChips
          value={filter}
          onChange={setFilter}
          options={[
            { key: "ALL", label: "All", count: orders.length },
            { key: "RESERVED", label: "To process", count: count("RESERVED") },
            { key: "PROCESSING", label: "Processing", count: count("PROCESSING") },
            { key: "FULFILLED", label: "Fulfilled", count: count("FULFILLED") },
            { key: "CANCELLED", label: "Cancelled", count: count("CANCELLED") },
          ]}
        />
        <div className="relative md:w-72">
          <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Order # or buyer"
            aria-label="Search orders"
            className="w-full pl-11 pr-4 py-2.5 font-body text-sm"
          />
        </div>
      </div>

      <div className="mt-5">
        {orders.length === 0 ? (
          <EmptyState icon="receipt_long" title="No orders yet" text="When a buyer reserves your products, it shows up here." />
        ) : filtered.length === 0 ? (
          <EmptyState icon="search" title="Nothing here" text="Try another filter or search." />
        ) : (
          <>
            {/* Desktop table — the whole row opens the order */}
            <div className="hidden md:block rounded-xl border border-black/10 overflow-hidden">
              <table className="w-full font-body text-sm">
                <thead className="bg-surface text-left text-xs text-passive">
                  <tr>
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium">Buyer</th>
                    <th className="px-4 py-3 font-medium">Items</th>
                    <th className="px-4 py-3 font-medium text-right">Your total</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => navigate(`/seller/orders/${o.id}`)}
                      className="border-t border-black/5 hover:bg-surface/60 cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        <Link to={`/seller/orders/${o.id}`} className="font-semibold hover:underline" onClick={(e) => e.stopPropagation()}>
                          #{o.id}
                        </Link>
                        <span className="block text-xs text-passive">{formatDate(o.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="block truncate max-w-[12rem]">{o.buyer?.name}</span>
                        <span className="block text-xs text-passive">
                          {o.deliveryType === "PICKUP" ? "Pickup" : "Delivery"} · {o.paymentMethod === "GCASH" ? "GCash" : "Cash"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-passive truncate max-w-[16rem]">{itemsLine(o)}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatPeso(subtotal(o))}</td>
                      <td className="px-4 py-3">
                        <span className="flex gap-1.5 flex-wrap">
                          <OrderPill status={o.status} />
                          <PaymentPill status={o.paymentStatus} />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Phone cards */}
            <ul className="md:hidden flex flex-col gap-2.5">
              {filtered.map((o) => (
                <li key={o.id}>
                  <Link to={`/seller/orders/${o.id}`} className="block rounded-xl border border-black/10 p-4 active:bg-surface">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-body font-bold text-sm">Order #{o.id}</span>
                      <span className="font-body font-bold text-sm tabular-nums">{formatPeso(subtotal(o))}</span>
                    </div>
                    <p className="font-body text-sm mt-1 truncate">
                      {o.buyer?.name} · {o.deliveryType === "PICKUP" ? "Pickup" : "Delivery"}
                    </p>
                    <p className="font-body text-xs text-passive truncate">{itemsLine(o)}</p>
                    <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                      <OrderPill status={o.status} />
                      <PaymentPill status={o.paymentStatus} />
                      <span className="ml-auto font-body text-xs text-passive">{formatDate(o.createdAt)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default OrdersReceived;
