import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
// Status pill reuse — same colors as order pages
import { OrderPill } from "../../components/OrderStatus.jsx";
import Spinner from "../../components/Spinner.jsx";
// Revenue trend — objective 1g, recharts column chart
import RevenueChart from "../../components/RevenueChart.jsx";
import { fetchSellerAnalytics } from "../../api/analytics.api.js";

// Dashboard — seller landing page, one analytics call powers everything.
// revenueChart renders through RevenueChart below the summary cards.
const Dashboard = () => {
  // Whole analytics bundle: summary, ordersByStatus, lists
  const [stats, setStats] = useState(null);
  // Loading flag
  const [loading, setLoading] = useState(true);

  // Load the bundle once — dashboard is a snapshot page
  useEffect(() => {
    fetchSellerAnalytics()
      .then((res) => setStats(res.data))
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  // Loading state
  if (loading || !stats) {
    return (
      <div className="py-16 flex items-center justify-center gap-3 font-body text-sm text-passive">
        <Spinner />
        Loading dashboard...
      </div>
    );
  }

  // Short destructured reads
  const { summary, ordersByStatus, topProducts, recentOrders, revenueChart } = stats;
  // Fresh DB friendly — zeros are honest, empty notes say so out loud
  const hasSales = summary.totalOrders > 0;

  return (
    <div className="page-enter">
      {/* Header row — actions on the right */}
      <div className="flex items-start gap-3 flex-wrap">
        <div>
          <h1 className="font-header font-bold text-xl md:text-2xl text-gray-900">
            Seller Dashboard
          </h1>
          <p className="font-body text-sm text-passive mt-1">
            Your shop numbers at a glance.
          </p>
        </div>
        {/* Quick actions */}
        <div className="flex gap-2 ml-auto flex-wrap">
          <Link
            to="/seller/add-product"
            className="btn-primary rounded-lg px-3 py-2 font-body text-xs font-bold"
          >
            Add product
          </Link>
          <Link
            to="/seller/orders"
            className="btn-active border border-gray-200 rounded-lg px-3 py-2 font-body text-xs font-bold text-gray-900"
          >
            Orders
          </Link>
        </div>
      </div>

      {/* ── SUMMARY CARDS ── */}
      <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Revenue card */}
        <div className="border border-gray-100 rounded-xl p-4">
          <p className="font-body text-xs font-bold text-passive uppercase tracking-wide">
            Revenue
          </p>
          <p className="font-header font-bold text-xl md:text-2xl text-primary mt-1">
            ₱{summary.totalRevenue.toLocaleString()}
          </p>
          <p className="font-body text-xs text-passive mt-1">
            from fulfilled orders
          </p>
        </div>
        {/* Orders card */}
        <div className="border border-gray-100 rounded-xl p-4">
          <p className="font-body text-xs font-bold text-passive uppercase tracking-wide">
            Orders
          </p>
          <p className="font-header font-bold text-xl md:text-2xl text-gray-900 mt-1">
            {summary.totalOrders.toLocaleString()}
          </p>
          <p className="font-body text-xs text-passive mt-1">
            all statuses
          </p>
        </div>
        {/*.Items sold card */}
        <div className="border border-gray-100 rounded-xl p-4">
          <p className="font-body text-xs font-bold text-passive uppercase tracking-wide">
            Items sold
          </p>
          <p className="font-header font-bold text-xl md:text-2xl text-gray-900 mt-1">
            {summary.totalItemsSold.toLocaleString()}
          </p>
          <p className="font-body text-xs text-passive mt-1">
            units, fulfilled only
          </p>
        </div>
        {/* Low stock card — links straight to the monitor */}
        <Link
          to="/seller/inventory"
          className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors"
        >
          <p className="font-body text-xs font-bold text-passive uppercase tracking-wide">
            Low stock
          </p>
          <p
            className={`font-header font-bold text-xl md:text-2xl mt-1 ${
              summary.lowStockCount > 0 ? "text-danger" : "text-gray-900"
            }`}
          >
            {summary.lowStockCount}
          </p>
          <p className="font-body text-xs text-passive mt-1">
            tap to manage stock
          </p>
        </Link>
      </div>

      {/* ── REVENUE TREND ── */}
      {/* Monthly fulfilled revenue, zero-filled to an even 6-month axis */}
      <div className="mt-5">
        <RevenueChart data={revenueChart} />
      </div>

      {/* ── ORDER PIPELINE CHIPS ── */}
      <div className="mt-3 border border-gray-100 rounded-xl p-4">
        <p className="font-body font-bold text-sm text-gray-900">
          Orders by status
        </p>
        {ordersByStatus.length === 0 ? (
          <p className="font-body text-sm text-passive mt-2">
            No orders yet — numbers show up here after a buyer checks out.
          </p>
        ) : (
          <div className="flex gap-3 flex-wrap mt-3">
            {ordersByStatus.map((s) => (
              // Pill plus live count, same pill colors buyers know
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

      {/* ── TOP PRODUCTS + RECENT ORDERS ── */}
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {/* Top products */}
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="font-body font-bold text-sm text-gray-900">
              Top products
            </p>
          </div>
          {topProducts.length === 0 ? (
            <p className="p-4 font-body text-sm text-passive">
              No sales yet — your best sellers land here.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {topProducts.map((t) => (
                <li key={t.product.id}>
                  <Link
                    to={`/seller/products/${t.product.id}/edit`}
                    className="p-3 flex gap-3 items-center hover:bg-gray-50 transition-colors overflow-hidden"
                  >
                    {/* Thumb or letter fallback — no photos never breaks layout */}
                    {t.product.imageUrl ? (
                      <img
                        src={t.product.imageUrl}
                        alt={t.product.name}
                        className="w-10 h-10 rounded-lg object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center font-header text-gray-400">
                        {t.product.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* Name + stats */}
                    <div className="min-w-0 flex-1">
                      <p className="font-body font-bold text-sm text-gray-900 truncate">
                        {t.product.name}
                      </p>
                      <p className="font-body text-xs text-passive mt-0.5">
                        {t.totalSold} sold · in {t.totalOrders}{" "}
                        {t.totalOrders === 1 ? "order" : "orders"}
                      </p>
                    </div>
                    {/* Price */}
                    <p className="font-body text-xs text-gray-700 shrink-0">
                      ₱{parseFloat(t.product.price).toFixed(2)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent orders */}
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="font-body font-bold text-sm text-gray-900">
              Recent orders
            </p>
            <Link
              to="/seller/orders"
              className="font-body text-xs text-primary font-bold"
            >
              View all
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="p-4 font-body text-sm text-passive">
              No orders yet — they show up here the moment a buyer commits.
            </p>
          ) : (
            // Rows carry YOUR slice subtotal — totalAmount includes other sellers
            <ul className="divide-y divide-gray-100">
              {recentOrders.map((o) => {
                // Seller-slice subtotal from own items only
                const slice = o.orderItems.reduce(
                  (sum, i) => sum + parseFloat(i.price) * i.quantity,
                  0,
                );
                return (
                  <li key={o.id}>
                    <Link
                      to={`/seller/orders/${o.id}`}
                      className="p-3 flex gap-3 items-center hover:bg-gray-50 transition-colors overflow-hidden"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-body font-bold text-sm text-gray-900">
                          Order #{o.id} · {o.buyer?.name || "Buyer"}
                        </p>
                        <p className="font-body text-xs text-passive mt-0.5">
                          {new Date(o.createdAt).toLocaleDateString("en-PH", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <OrderPill status={o.status} />
                      <p className="font-body font-bold text-sm text-gray-900 shrink-0">
                        ₱{slice.toFixed(2)}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Honest zero-state banner for a brand-new shop */}
      {!hasSales && (
        <p className="mt-4 font-body text-sm text-passive border border-gray-100 rounded-xl p-4">
          Empty numbers right now — make a test order as a buyer and watch this
          page fill up live.
        </p>
      )}
    </div>
  );
};

export default Dashboard;