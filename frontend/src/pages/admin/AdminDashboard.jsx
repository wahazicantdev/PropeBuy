import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
// Status pill reuse — same colors buyers and sellers already know
import { OrderPill } from "../../components/OrderStatus.jsx";
import Spinner from "../../components/Spinner.jsx";
import { fetchPlatformAnalytics } from "../../api/analytics.api.js";

// AdminDashboard — platform landing page, one analytics call powers
// everything. Bars are plain divs on purpose: recharts is installed but
// belongs to Phase F, same discipline as the seller Dashboard.
const AdminDashboard = () => {
  // Whole platform bundle: users, products, orders, revenue, barangays
  const [stats, setStats] = useState(null);
  // Loading flag until the first fetch settles
  const [loading, setLoading] = useState(true);

  // Load once — dashboard is a snapshot page, not a live feed
  useEffect(() => {
    fetchPlatformAnalytics()
      .then((res) => setStats(res.data))
      .catch((err) => {
        // Validator array first, else message — house error pattern
        const msg =
          err.response?.data?.errors?.[0]?.message ||
          err.response?.data?.message ||
          "Failed to load platform dashboard";
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  // Loading state — spinner, no layout jump
  if (loading || !stats) {
    return (
      <div className="py-16 flex items-center justify-center gap-3 font-body text-sm text-passive">
        <Spinner />
        Loading platform dashboard...
      </div>
    );
  }

  // Short destructured reads
  const { users, products, orders, revenue, topBarangays } = stats;
  // Biggest barangay drives the bar widths — relative, not absolute
  const maxProducts = Math.max(
    ...topBarangays.map((b) => b.productCount),
    1, // never divide by zero on a fresh database
  );

  return (
    <div className="page-enter">
      {/* Header row — title left, the one urgent action right */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="font-header font-bold text-xl md:text-2xl text-gray-900">
            Platform Dashboard
          </h1>
          <p className="font-body text-sm text-passive mt-1">
            Muntinlupa barangay marketplace at a glance.
          </p>
        </div>
        {/* Quick actions — verifications first, it is the blocking queue */}
        <div className="flex gap-2 ml-auto flex-wrap">
          <Link
            to="/admin/pending"
            className="btn-primary rounded-lg px-3 py-2 font-body text-xs font-bold"
          >
            Review verifications
          </Link>
          <Link
            to="/admin/orders"
            className="btn-active border border-gray-200 rounded-lg px-3 py-2 font-body text-xs font-bold text-gray-900"
          >
            Orders
          </Link>
        </div>
      </div>

      {/* ── PENDING BANNER ── */}
      {/* Only shows when work is waiting — restraint, same rule as pills */}
      {users.pendingVerifications > 0 && (
        <Link
          to="/admin/pending"
          className="mt-5 block border border-danger/30 bg-danger/5 rounded-xl p-4 hover:bg-danger/10 transition-colors"
        >
          <p className="font-body font-bold text-sm text-danger">
            {users.pendingVerifications} registration
            {users.pendingVerifications === 1 ? "" : "s"} waiting for review
          </p>
          <p className="font-body text-xs text-passive mt-1">
            Vendors cannot list goods until you approve them — tap to review.
          </p>
        </Link>
      )}

      {/* ── SUMMARY CARDS ── */}
      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Platform revenue — fulfilled orders only, same rule as seller side */}
        <div className="border border-gray-100 rounded-xl p-4">
          <p className="font-body text-xs font-bold text-passive uppercase tracking-wide">
            Revenue
          </p>
          <p className="font-header font-bold text-xl md:text-2xl text-primary mt-1">
            ₱{revenue.total.toLocaleString()}
          </p>
          <p className="font-body text-xs text-passive mt-1">
            from fulfilled orders
          </p>
        </div>
        {/* Orders — every status counted */}
        <div className="border border-gray-100 rounded-xl p-4">
          <p className="font-body text-xs font-bold text-passive uppercase tracking-wide">
            Orders
          </p>
          <p className="font-header font-bold text-xl md:text-2xl text-gray-900 mt-1">
            {orders.total.toLocaleString()}
          </p>
          <p className="font-body text-xs text-passive mt-1">all statuses</p>
        </div>
        {/* Live listings — active products only */}
        <Link
          to="/admin/products"
          className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors"
        >
          <p className="font-body text-xs font-bold text-passive uppercase tracking-wide">
            Listings
          </p>
          <p className="font-header font-bold text-xl md:text-2xl text-gray-900 mt-1">
            {products.total.toLocaleString()}
          </p>
          <p className="font-body text-xs text-passive mt-1">
            tap to moderate
          </p>
        </Link>
        {/* Pending — red when work waits, neutral when the queue is clear */}
        <Link
          to="/admin/pending"
          className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors"
        >
          <p className="font-body text-xs font-bold text-passive uppercase tracking-wide">
            Pending
          </p>
          <p
            className={`font-header font-bold text-xl md:text-2xl mt-1 ${
              users.pendingVerifications > 0 ? "text-danger" : "text-gray-900"
            }`}
          >
            {users.pendingVerifications}
          </p>
          <p className="font-body text-xs text-passive mt-1">
            awaiting review
          </p>
        </Link>
      </div>

      {/* ── PEOPLE SPLIT ── */}
      <div className="mt-3 grid grid-cols-3 gap-3">
        {/* Total accounts */}
        <div className="border border-gray-100 rounded-xl p-4">
          <p className="font-body text-xs font-bold text-passive uppercase tracking-wide">
            Accounts
          </p>
          <p className="font-header font-bold text-lg md:text-xl text-gray-900 mt-1">
            {users.total.toLocaleString()}
          </p>
        </div>
        {/* Buyers */}
        <div className="border border-gray-100 rounded-xl p-4">
          <p className="font-body text-xs font-bold text-passive uppercase tracking-wide">
            Buyers
          </p>
          <p className="font-header font-bold text-lg md:text-xl text-gray-900 mt-1">
            {users.buyers.toLocaleString()}
          </p>
        </div>
        {/* Vendors */}
        <div className="border border-gray-100 rounded-xl p-4">
          <p className="font-body text-xs font-bold text-passive uppercase tracking-wide">
            Vendors
          </p>
          <p className="font-header font-bold text-lg md:text-xl text-gray-900 mt-1">
            {users.sellers.toLocaleString()}
          </p>
        </div>
      </div>

      {/* ── ORDER PIPELINE CHIPS ── */}
      <div className="mt-3 border border-gray-100 rounded-xl p-4">
        <p className="font-body font-bold text-sm text-gray-900">
          Orders by status
        </p>
        {orders.byStatus.length === 0 ? (
          <p className="font-body text-sm text-passive mt-2">
            No orders yet — numbers show up here after the first checkout.
          </p>
        ) : (
          <div className="flex gap-3 flex-wrap mt-3">
            {orders.byStatus.map((s) => (
              // Pill plus live count, same colors across all three portals
              <span key={s.status} className="flex items-center gap-1.5">
                <OrderPill status={s.status} />
                <span className="font-body font-bold text-sm text-gray-900">
                  {s._count.status}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── TOP BARANGAYS ── */}
      {/* Plain div bars — relative widths, zero chart library needed */}
      <div className="mt-3 border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
          <p className="font-body font-bold text-sm text-gray-900">
            Top barangays by listings
          </p>
          <Link
            to="/admin/barangays"
            className="font-body text-xs text-primary font-bold shrink-0"
          >
            Manage
          </Link>
        </div>
        {topBarangays.length === 0 ? (
          <p className="p-4 font-body text-sm text-passive">
            No listings yet — barangay coverage shows up here once vendors
            post goods.
          </p>
        ) : (
          <ul className="p-4 flex flex-col gap-3">
            {topBarangays.map((b) => (
              // min-w-0 so long barangay names shrink instead of overflowing
              <li key={b.barangay?.id || b.barangay?.name} className="min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-body text-sm text-gray-900 truncate">
                    {b.barangay?.name || "Unknown barangay"}
                  </p>
                  <p className="font-body font-bold text-sm text-gray-900 shrink-0">
                    {b.productCount}
                  </p>
                </div>
                {/* Track + fill — percentage is relative to the leader */}
                <div className="mt-1.5 h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${(b.productCount / maxProducts) * 100}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Honest zero-state banner for a fresh database */}
      {orders.total === 0 && (
        <p className="mt-4 font-body text-sm text-passive border border-gray-100 rounded-xl p-4">
          Empty numbers right now — register a vendor, approve them, list a
          product, then buy it as a buyer and watch this page fill up live.
        </p>
      )}

      {/* Scope note — charts are Phase F, said out loud instead of faked */}
      <p className="mt-3 font-body text-xs text-passive">
        Bars are relative to the busiest barangay. Full charts land in Phase F.
      </p>
    </div>
  );
};

export default AdminDashboard;
