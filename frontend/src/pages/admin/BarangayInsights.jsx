import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import PageHeader from "../../components/PageHeader.jsx";
import StatCard from "../../components/StatCard.jsx";
import RevenueChart from "../../components/RevenueChart.jsx";
import Select from "../../components/Select.jsx";
import Spinner from "../../components/Spinner.jsx";
import Icon from "../../components/Icon.jsx";
import { fetchInsights } from "../../api/admin.api.js";
import { formatPeso } from "../../utils/format.js";
import { useAuthStore } from "../../stores/auth.store.js";

// Change from last month as "+25%" / "-10%", or a plain note
const change = (now, before) => {
  if (!before) return now ? "First sales this month" : "No sales yet";
  const pct = Math.round(((now - before) / before) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}% from last month`;
};

// Barangay Insights — what PropeBuy gives back to a barangay (Yoy, 11-18).
// Totals only: no names, no documents, no addresses. A verifier always
// sees their own barangay; the super admin and moderators can switch.
const BarangayInsights = () => {
  const user = useAuthStore((s) => s.user);
  const verifier = user?.adminLevel === "BARANGAY_VERIFIER";
  // Picked barangay (super admin and moderators), null for the default
  const [barangayId, setBarangayId] = useState(null);
  // Page data, null while loading
  const [data, setData] = useState(null);

  // Load on mount and when another barangay is picked
  useEffect(() => {
    fetchInsights(barangayId)
      .then((res) => setData(res.data))
      .catch(() => toast.error("Could not load the barangay numbers"));
  }, [barangayId]);

  if (!data) {
    return (
      <div className="py-16 flex items-center justify-center gap-3 font-body text-sm text-passive">
        <Spinner /> Loading barangay numbers...
      </div>
    );
  }

  const { people, products, thisMonth, lastMonth, topCategories, chart } = data;
  // Widest category bar = 100%
  const maxProducts = Math.max(1, ...products.byCategory.map((c) => c.count));

  return (
    <div className="page-enter">
      <PageHeader
        title={`Barangay ${data.barangay.name}`}
        subtitle="Your community's local trade on PropeBuy. Totals only, so no resident's personal data is shown."
        actions={
          !verifier && data.barangays.length > 0 ? (
            <div className="w-56 max-w-full">
              <Select
                value={data.barangay.id}
                onChange={(v) => setBarangayId(Number(v))}
                options={data.barangays.map((b) => ({ value: b.id, label: b.name }))}
                ariaLabel="Barangay"
              />
            </div>
          ) : null
        }
      />

      {/* Waiting applicants — the verifier's main job, one tap away */}
      {people.pending > 0 && (
        <Link
          to="/admin/pending"
          className="mb-5 rounded-xl bg-surface p-4 flex items-center gap-3 font-body text-sm hover:bg-black/5"
        >
          <Icon name="how_to_reg" />
          <span className="flex-1 min-w-0">
            <span className="font-bold">{people.pending}</span> resident{people.pending === 1 ? "" : "s"} waiting for verification
          </span>
          <Icon name="chevron_right" />
        </Link>
      )}

      {/* ── NUMBER TILES ── */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard tone="dark" icon="payments" label="Completed sales this month" value={formatPeso(thisMonth.sales)} hint={change(thisMonth.sales, lastMonth.sales)} />
        <StatCard icon="receipt_long" label="Completed orders this month" value={thisMonth.orders} hint={`${lastMonth.orders} last month`} />
        <StatCard icon="storefront" label="Verified sellers" value={people.sellers} hint={`${products.total} products listed`} />
        <StatCard icon="group" label="Verified buyers" value={people.buyers} hint={`${people.newThisMonth} new this month`} />
      </div>

      {/* ── SALES CHART — same chart as the seller dashboard ── */}
      <section className="mt-6 border border-black/10 rounded-xl p-4 md:p-5">
        <h2 className="heading-body text-lg font-bold mb-3">Local sales, last 6 months</h2>
        <RevenueChart data={chart} />
      </section>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* ── PRODUCTS BY CATEGORY ── */}
        <section className="border border-black/10 rounded-xl p-4 md:p-5 min-w-0">
          <h2 className="heading-body text-lg font-bold mb-3">Products by category</h2>
          {products.byCategory.length === 0 ? (
            <p className="font-body text-sm text-passive">No products listed yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {products.byCategory.map((c) => (
                <li key={c.category} className="font-body text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="truncate">{c.category}</span>
                    <span className="font-bold tabular-nums">{c.count}</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-surface overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(c.count / maxProducts) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ── TOP CATEGORIES THIS MONTH ── */}
        <section className="border border-black/10 rounded-xl p-4 md:p-5 min-w-0">
          <h2 className="heading-body text-lg font-bold mb-3">Best-selling categories this month</h2>
          {/* Fulfilled orders only, same as the tiles and the chart */}
          {topCategories.length === 0 ? (
            <p className="font-body text-sm text-passive">No sales yet this month.</p>
          ) : (
            <ol className="space-y-2 font-body text-sm">
              {topCategories.map((c, i) => (
                <li key={c.category} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-surface flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                  <span className="flex-1 min-w-0 truncate">{c.category}</span>
                  <span className="font-bold tabular-nums">{formatPeso(c.sales)}</span>
                </li>
              ))}
            </ol>
          )}
          <p className="mt-4 font-body text-xs text-passive">
            Useful for planning livelihood trainings and inviting the right sellers to trade fairs.
          </p>
        </section>
      </div>
    </div>
  );
};

export default BarangayInsights;
