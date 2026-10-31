import { useEffect, useState } from "react";
import toast from "react-hot-toast";
// Shared pieces — same pills buyers and sellers see
import { OrderPill, PaymentPill } from "../../components/OrderStatus.jsx";
import Select from "../../components/Select.jsx";
import Spinner from "../../components/Spinner.jsx";
import { fetchAllOrders } from "../../api/admin.api.js";

// OrdersOverview — every order on the platform, read-only on purpose.
// Admin oversight does NOT include changing order status: fulfilment
// belongs to the seller who owns the goods, and payment state belongs to
// PayMongo. Inventing an admin status override would break the TPS audit
// trail the whole capstone rests on.
const OrdersOverview = () => {
  // Rows for the active filters
  const [orders, setOrders] = useState([]);
  // Server-side filters — all three are real query params
  const [status, setStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  // Loading flag
  const [loading, setLoading] = useState(true);
  // Expanded order — items are already in the payload, no extra fetch
  const [openId, setOpenId] = useState(null);

  // Shared error reader — validator array first, else message
  const readError = (err, fallback) =>
    err.response?.data?.errors?.[0]?.message ||
    err.response?.data?.message ||
    fallback;

  // Load rows — refetches whenever any filter changes.
  // No setLoading(true) in here: an effect body must not setState
  // synchronously (react-hooks/set-state-in-effect). The spinner is
  // true on first paint and each filter handler flips it on itself.
  useEffect(() => {
    fetchAllOrders({ status, paymentMethod, paymentStatus })
      .then((res) => setOrders(res.data || []))
      .catch((err) => toast.error(readError(err, "Failed to load orders")))
      .finally(() => setLoading(false));
  }, [status, paymentMethod, paymentStatus]);

  // ── TOTALS FOR THE CURRENT VIEW ──
  // Derived, never stored — same rule as the cart store totals
  const viewTotal = orders.reduce(
    (sum, o) => sum + parseFloat(o.totalAmount),
    0,
  );
  // Money actually collected — PAID rows only, the honest number
  const paidTotal = orders
    .filter((o) => o.paymentStatus === "PAID")
    .reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

  return (
    <div className="page-enter">
      {/* Header row */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="font-header font-bold text-xl md:text-2xl text-gray-900">
            Orders Overview
          </h1>
          <p className="font-body text-sm text-passive mt-1">
            {orders.length} order{orders.length === 1 ? "" : "s"} in this view
          </p>
        </div>
      </div>

      {/* ── VIEW TOTALS ── */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="border border-gray-100 rounded-xl p-4">
          <p className="font-body text-xs font-bold text-passive uppercase tracking-wide">
            Order value
          </p>
          <p className="font-header font-bold text-lg md:text-xl text-gray-900 mt-1">
            ₱{viewTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="font-body text-xs text-passive mt-1">
            this filtered view
          </p>
        </div>
        <div className="border border-gray-100 rounded-xl p-4">
          <p className="font-body text-xs font-bold text-passive uppercase tracking-wide">
            Collected
          </p>
          <p className="font-header font-bold text-lg md:text-xl text-primary mt-1">
            ₱{paidTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="font-body text-xs text-passive mt-1">paid orders only</p>
        </div>
        <div className="border border-gray-100 rounded-xl p-4 col-span-2 md:col-span-1">
          <p className="font-body text-xs font-bold text-passive uppercase tracking-wide">
            Unpaid
          </p>
          <p className="font-header font-bold text-lg md:text-xl text-gray-900 mt-1">
            {orders.filter((o) => o.paymentStatus === "PENDING").length}
          </p>
          <p className="font-body text-xs text-passive mt-1">
            awaiting cash or GCash
          </p>
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      {/* Values come straight from the documented Prisma enums */}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="min-w-0">
          <label className="font-body text-xs font-bold text-gray-900 block mb-1.5">
            Order status
          </label>
          <Select
            value={status}
            onChange={(v) => {
              // Spinner on at the tap, off in the effect's .finally()
              setLoading(true);
              setStatus(v);
            }}
            ariaLabel="Filter by order status"
            options={[
              { value: "", label: "All statuses" },
              { value: "RESERVED", label: "Reserved" },
              { value: "PROCESSING", label: "Processing" },
              { value: "FULFILLED", label: "Fulfilled" },
              { value: "CANCELLED", label: "Cancelled" },
            ]}
          />
        </div>
        <div className="min-w-0">
          <label className="font-body text-xs font-bold text-gray-900 block mb-1.5">
            Payment method
          </label>
          <Select
            value={paymentMethod}
            onChange={(v) => {
              setLoading(true);
              setPaymentMethod(v);
            }}
            ariaLabel="Filter by payment method"
            options={[
              { value: "", label: "All methods" },
              { value: "CASH", label: "Cash" },
              { value: "GCASH", label: "GCash" },
            ]}
          />
        </div>
        <div className="min-w-0">
          <label className="font-body text-xs font-bold text-gray-900 block mb-1.5">
            Payment status
          </label>
          <Select
            value={paymentStatus}
            onChange={(v) => {
              setLoading(true);
              setPaymentStatus(v);
            }}
            ariaLabel="Filter by payment status"
            options={[
              { value: "", label: "All payment states" },
              { value: "PENDING", label: "Pending" },
              { value: "PAID", label: "Paid" },
              { value: "FAILED", label: "Failed" },
            ]}
          />
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-16 flex items-center justify-center gap-3 font-body text-sm text-passive">
          <Spinner />
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-6 border border-dashed border-gray-300 rounded-xl p-10 text-center">
          <p className="font-body text-sm text-passive">
            No orders match these filters.
          </p>
        </div>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {orders.map((o) => (
            <li
              key={o.id}
              className="border border-gray-100 rounded-xl p-4 overflow-hidden"
            >
              {/* Summary row */}
              <div className="flex items-start gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <p className="font-body font-bold text-sm md:text-base text-gray-900">
                    Order #{o.id}
                  </p>
                  <p className="font-body text-xs text-passive truncate mt-0.5">
                    {o.buyer?.name || "Buyer"} · {o.buyer?.email || "no email"}
                  </p>
                  <p className="font-body text-xs text-passive mt-0.5">
                    {new Date(o.createdAt).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    · {o.paymentMethod === "GCASH" ? "GCash" : "Cash"} ·{" "}
                    {o.deliveryType === "DELIVERY" ? "Delivery" : "Pickup"}
                  </p>
                </div>
                {/* Pills + money */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex gap-2 flex-wrap justify-end">
                    <OrderPill status={o.status} />
                    <PaymentPill status={o.paymentStatus} />
                  </div>
                  <p className="font-body font-bold text-sm text-gray-900">
                    ₱{parseFloat(o.totalAmount).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Toggle — items ride in the list payload already */}
              <button
                onClick={() => setOpenId(openId === o.id ? null : o.id)}
                className="btn-active mt-3 border border-gray-200 rounded-lg px-3 py-2 font-body text-xs font-bold text-gray-900"
              >
                {openId === o.id
                  ? "Hide items"
                  : `View ${o.orderItems.length} item${o.orderItems.length === 1 ? "" : "s"}`}
              </button>

              {/* Item drawer — which vendor owns each line.
                  This is the multi-vendor proof: one order can hold
                  goods from several barangay sellers at once. */}
              {openId === o.id && (
                <ul className="mt-3 border border-gray-100 rounded-lg divide-y divide-gray-100 overflow-hidden">
                  {o.orderItems.map((i) => (
                    <li
                      key={i.id}
                      className="p-3 flex gap-3 items-center justify-between min-w-0"
                    >
                      <div className="min-w-0">
                        <p className="font-body text-sm text-gray-900 line-clamp-2">
                          {i.product?.name || "Removed product"}
                        </p>
                        <p className="font-body text-xs text-passive truncate mt-0.5">
                          vendor: {i.product?.seller?.name || "unknown"}
                        </p>
                      </div>
                      {/* Price captured AT CHECKOUT, not current price —
                          the TPS snapshot, so history never shifts */}
                      <p className="font-body text-xs text-gray-700 shrink-0 text-right">
                        {i.quantity} × ₱{parseFloat(i.price).toFixed(2)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Scope note — read-only by design, said out loud */}
      <p className="mt-4 font-body text-xs text-passive border border-gray-100 rounded-xl p-3">
        Oversight view only. Fulfilment stays with the vendor who owns the
        goods and payment state stays with the gateway — no admin override
        exists, so the transaction audit trail cannot be edited after the
        fact.
      </p>
    </div>
  );
};

export default OrdersOverview;
