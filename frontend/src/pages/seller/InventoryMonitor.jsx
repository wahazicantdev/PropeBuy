import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
// House stock pill — thresholds match backend (0 = out, <= 3 = low)
import StockPill from "../../components/StockPill.jsx";
import Spinner from "../../components/Spinner.jsx";
import { fetchMyProducts } from "../../api/product.api.js";
// Live tick — socket events refetch this page, no manual refresh
import { useLiveTick } from "../../hooks/useSocket.js";

// InventoryMonitor — full-stocking view of active listings.
// Data from my-products (includes inactive), monitor only counts live ones.
const InventoryMonitor = () => {
  // All products, sorted worst stock first
  const [products, setProducts] = useState(null);
  // Loading flag
  const [loading, setLoading] = useState(true);
  // Chip filter: all | out | low | healthy
  const [filter, setFilter] = useState("all");

  // Load listings once, then sort worst stock to the top
  // Bumps on new_order and low_stock_alert — stock counts stay true
  const live = useLiveTick();

  useEffect(() => {
    fetchMyProducts()
      .then((res) => {
        // stock ascending — most critical first
        const sorted = [...res.data].sort((a, b) => a.stock - b.stock);
        setProducts(sorted);
      })
      .catch(() => toast.error("Failed to load inventory"))
      .finally(() => setLoading(false));
  }, [live]);

  // Loading state
  if (loading || !products) {
    return (
      <div className="py-16 flex items-center justify-center gap-3 font-body text-sm text-passive">
        <Spinner />
        Loading inventory...
      </div>
    );
  }

  // Active listings only — deleted ones don't sell, don't alert
  const active = products.filter((p) => p.isActive);
  // Count line
  const outCount = active.filter((p) => p.stock === 0).length;
  const lowCount = active.filter((p) => p.stock > 0 && p.stock <= 3).length;
  const healthyCount = active.length - outCount - lowCount;
  // Bucket per chip — same math as the pills
  const buckets = {
    all: active,
    out: active.filter((p) => p.stock === 0),
    low: active.filter((p) => p.stock > 0 && p.stock <= 3),
    healthy: active.filter((p) => p.stock >= 4),
  };
  // Rows for the chosen chip
  const rows = buckets[filter];
  // Restock banner shows only when danger exists
  const needsRestock = outCount + lowCount > 0;

  return (
    <div className="page-enter">
      {/* Header */}
      <h1 className="font-header font-bold text-xl md:text-2xl text-gray-900">
        Inventory Monitor
      </h1>
      <p className="font-body text-sm text-passive mt-1">
        Stock levels across your live listings — worst first.
      </p>

      {/* Restock warning — plain words, no alarmism */}
      {needsRestock && (
        <p className="mt-3 font-body text-sm text-danger border border-danger/20 bg-danger/5 rounded-xl p-3">
          {outCount + lowCount} product
          {outCount + lowCount === 1 ? "" : "s"} at or below the warning line of
          3 — restock from the edit form before buyers bounce off.
        </p>
      )}

      {/* Filter chips with live counts */}
      <div className="mt-4 flex gap-2 flex-wrap">
        {[
          { key: "all", label: `All (${active.length})` },
          { key: "out", label: `Out (${outCount})` },
          { key: "low", label: `Low (${lowCount})` },
          { key: "healthy", label: `Healthy (${healthyCount})` },
        ].map((chip) => (
          <button
            key={chip.key}
            onClick={() => setFilter(chip.key)}
            // Chip swap pattern — active chip gets the primary text hint
            className={`rounded-full px-3 py-1.5 font-body text-xs font-bold border transition-colors ${
              filter === chip.key
                ? "border-primary text-primary bg-primary/5"
                : "border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* List — worst stock first thanks to the sort */}
      {rows.length === 0 ? (
        <div className="mt-4 border border-black/10 rounded-xl p-6 text-center">
          <p className="font-header font-bold text-lg text-gray-900">
            Nothing here
          </p>
          <p className="font-body text-sm text-passive mt-1">
            {filter === "all"
              ? "No live listings yet — add a product to start selling."
              : "No products in this bucket right now."}
          </p>
        </div>
      ) : (
        <ul className="mt-4 border border-black/10 rounded-xl overflow-hidden divide-y divide-black/10">
          {rows.map((p) => (
            <li
              key={p.id}
              className="p-3 md:p-4 flex gap-3 items-center overflow-hidden"
            >
              {/* Thumb or letter fallback */}
              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center font-header text-gray-400">
                  {p.name.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Name + price */}
              <div className="min-w-0 flex-1">
                <p className="font-body font-bold text-sm text-gray-900 truncate">
                  {p.name}
                </p>
                <p className="font-body text-xs text-passive mt-0.5">
                  ₱{parseFloat(p.price).toFixed(2)}
                </p>
              </div>
              {/* Pill carries the state words */}
              <StockPill stock={p.stock} />
              {/* Edit = restock path */}
              <Link
                to={`/seller/products/${p.id}/edit`}
                className="font-body text-xs font-bold text-primary shrink-0 hover:underline"
              >
                Edit
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Honest scope note */}
      <p className="mt-4 font-body text-xs text-passive">
        Deleted listings don't sit in these buckets — they can't sell, so they
        can't run out.
      </p>
    </div>
  );
};

export default InventoryMonitor;