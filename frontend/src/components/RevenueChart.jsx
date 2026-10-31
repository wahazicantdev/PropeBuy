import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Brand primary — single series, so one color and no legend (the card
// title names the series). Contrast vs white passes the validator.
const PRIMARY = "#05829a";
// Recessive ink for axes and grid — data marks carry the emphasis
const GRID = "#f3f4f6";
const AXIS_INK = "#6b7280";

// Last N month keys as "YYYY-MM" in UTC — the backend buckets with
// createdAt.toISOString().slice(0, 7), so keys must be UTC to line up
const lastMonthKeys = (n) => {
  const now = new Date();
  const keys = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    keys.push(d.toISOString().slice(0, 7));
  }
  return keys;
};

// "2026-07" → "Jul" for the axis, "July 2026" for the tooltip and table
const monthLabel = (key, long = false) =>
  new Date(`${key}-01T00:00:00Z`).toLocaleDateString("en-PH", {
    month: long ? "long" : "short",
    ...(long ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });

// Peso formatter — axis ticks compact, tooltip and table exact
const peso = (v) =>
  `₱${Number(v).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pesoCompact = (v) =>
  v >= 1000 ? `₱${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `₱${Math.round(v)}`;

// Hover card — text in ink tokens, never the series color
const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-lg px-3 py-2">
      <p className="font-body text-xs text-passive">{monthLabel(row.month, true)}</p>
      <p className="font-body font-bold text-sm text-gray-900">{peso(row.revenue)}</p>
      <p className="font-body text-xs text-passive">
        {row.orders} fulfilled order{row.orders === 1 ? "" : "s"}
      </p>
    </div>
  );
};

// RevenueChart — objective 1g "revenue trends" for the seller dashboard.
// Backend sends only months that had fulfilled sales; quiet months are
// filled with zeros here so the time axis stays honest and evenly spaced.
const RevenueChart = ({ data = [] }) => {
  // Chart or table — the table is the accessible, exact-number view
  const [showTable, setShowTable] = useState(false);

  // Zero-fill the last 6 months, merging backend buckets by key
  const byMonth = new Map(data.map((d) => [d.month, d]));
  const rows = lastMonthKeys(6).map((month) => ({
    month,
    revenue: Number(byMonth.get(month)?.revenue || 0),
    orders: byMonth.get(month)?.orders || 0,
  }));

  // Headline numbers — the one-line answer above the plot
  const total = rows.reduce((sum, r) => sum + r.revenue, 0);
  const best = rows.reduce((top, r) => (r.revenue > top.revenue ? r : top), rows[0]);
  const hasSales = total > 0;

  return (
    <div className="border border-gray-100 rounded-xl p-4 min-w-0">
      {/* Title row — title names the single series, toggle on the right */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="font-body font-bold text-sm text-gray-900">
            Revenue trend
          </p>
          <p className="font-body text-xs text-passive mt-0.5">
            Fulfilled orders, last 6 months
          </p>
        </div>
        {hasSales && (
          <button
            onClick={() => setShowTable(!showTable)}
            className="btn-active border border-gray-200 rounded-lg px-3 py-1.5 font-body text-xs font-bold text-gray-900"
          >
            {showTable ? "Show chart" : "Show table"}
          </button>
        )}
      </div>

      {!hasSales ? (
        // Honest empty state — no fake bars on a brand-new shop
        <p className="font-body text-sm text-passive mt-3">
          No fulfilled sales in the last 6 months yet — this fills in as
          orders are completed.
        </p>
      ) : (
        <>
          {/* Headline — total plus the best month, in ink tokens */}
          <div className="mt-3 flex items-baseline gap-3 flex-wrap">
            <p className="font-header font-bold text-xl text-gray-900">
              {peso(total)}
            </p>
            <p className="font-body text-xs text-passive">
              best month: {monthLabel(best.month, true)} · {peso(best.revenue)}
            </p>
          </div>

          {showTable ? (
            // Table view — exact values, screen-reader friendly
            <table className="mt-3 w-full font-body text-sm">
              <thead>
                <tr className="text-left text-xs text-passive border-b border-gray-100">
                  <th className="py-2 font-bold">Month</th>
                  <th className="py-2 font-bold text-right">Orders</th>
                  <th className="py-2 font-bold text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.month} className="border-b border-gray-50">
                    <td className="py-2 text-gray-900">{monthLabel(r.month, true)}</td>
                    <td className="py-2 text-right text-gray-700">{r.orders}</td>
                    <td className="py-2 text-right font-bold text-gray-900">{peso(r.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            // Plot — fixed height, ResponsiveContainer fills the card width
            <div className="mt-3 h-56 w-full min-w-0" role="img" aria-label={`Revenue per month, last 6 months, total ${peso(total)}`}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: 0 }}>
                  {/* Horizontal guides only — recessive */}
                  <CartesianGrid vertical={false} stroke={GRID} />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(k) => monthLabel(k)}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: AXIS_INK, fontSize: 12, fontFamily: "Lato, sans-serif" }}
                  />
                  <YAxis
                    tickFormatter={pesoCompact}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    tick={{ fill: AXIS_INK, fontSize: 12, fontFamily: "Lato, sans-serif" }}
                  />
                  {/* Hover layer — full-column hit area, gray band cursor */}
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f9fafb" }} />
                  {/* Thin columns, 4px rounded data-ends anchored at zero */}
                  <Bar dataKey="revenue" fill={PRIMARY} radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RevenueChart;
