import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
// Shared pieces — pill, modal, spinner all built in STEP 3
import StockPill from "../../components/StockPill.jsx";
import ConfirmModal from "../../components/ConfirmModal.jsx";
import Spinner from "../../components/Spinner.jsx";
import { fetchMyProducts, deleteProduct } from "../../api/product.api.js";

// MyProducts — listings with status filters and soft-deleted rows
const MyProducts = () => {
  // Full list including inactive rows — backend sends everything
  const [products, setProducts] = useState([]);
  // Active chip — ALL / ACTIVE / LOW / DELETED
  const [filter, setFilter] = useState("ALL");
  // Loading flag until first fetch settles
  const [loading, setLoading] = useState(true);
  // Product chosen for deletion — ConfirmModal reads this
  const [deleteTarget, setDeleteTarget] = useState(null);
  // Busy while the delete request runs
  const [busy, setBusy] = useState(false);

  // Load listings — reusable so delete can refresh the same way
  const load = () => {
    setLoading(true);
    fetchMyProducts()
      .then((res) => setProducts(res.data || []))
      .catch((err) => {
        // Validator array first, else message — house pattern
        const msg =
          err.response?.data?.errors?.[0]?.message ||
          err.response?.data?.message ||
          "Failed to load your products";
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  };

  // First load on mount
  useEffect(() => {
    load();
  }, []);

  // ── FILTER COUNTS + MATCHING ──
  // Client-side, same call as the buyer OrderHistory chips.
  // Definitions mirror the backend: low stock = stock <= 3
  const counts = {
    ALL: products.length,
    // Active = listed, not low, not deleted — the healthy rows
    ACTIVE: products.filter((p) => p.isActive && p.stock > 3).length,
    // Low stock = active but 3 or fewer left, includes sold out
    LOW: products.filter((p) => p.isActive && p.stock <= 3).length,
    // Deleted = soft-deleted, kept for order history
    DELETED: products.filter((p) => !p.isActive).length,
  };
  // The visible rows follow the active chip
  const filtered = products.filter((p) => {
    if (filter === "ACTIVE") return p.isActive && p.stock > 3;
    if (filter === "LOW") return p.isActive && p.stock <= 3;
    if (filter === "DELETED") return !p.isActive;
    return true; // ALL
  });

  // Delete — soft delete on the backend, row returns grayed out
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const res = await deleteProduct(deleteTarget.id);
      toast.success(res.message || "Product deleted");
      // Close modal then refetch — grayed row proves soft delete
      setDeleteTarget(null);
      load();
    } catch (err) {
      const msg =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        "Delete failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  // Loading state — spinner, no layout jump
  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center gap-3 font-body text-sm text-passive">
        <Spinner />
        Loading your products...
      </div>
    );
  }

  return (
    // page-enter — subtle rise, house motion
    <div className="page-enter">
      {/* Header row — title left, CTA right, wraps on phone */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="font-header text-xl md:text-2xl text-gray-900">
            My Products
          </h1>
          <p className="font-body text-sm text-passive mt-1">
            {products.length} {products.length === 1 ? "listing" : "listings"}
          </p>
        </div>
        <Link
          to="/seller/add-product"
          className="btn-primary rounded-full px-4 py-2.5 font-body text-sm font-bold"
        >
          + Add Product
        </Link>
      </div>

      {/* Filter chips — counts live inside, tap to switch views */}
      <div className="flex gap-2 flex-wrap mt-4">
        {[
          { key: "ALL", label: "All" },
          { key: "ACTIVE", label: "Active" },
          { key: "LOW", label: "Low stock" },
          { key: "DELETED", label: "Deleted" },
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

      {/* Empty list state — guiding CTA when the seller has nothing yet */}
      {products.length === 0 ? (
        <div className="mt-10 border border-dashed border-gray-300 rounded-xl p-10 text-center">
          <p className="font-header text-lg text-gray-900">No products yet</p>
          <p className="font-body text-sm text-passive mt-1">
            Add your first product so buyers can find you.
          </p>
          <Link
            to="/seller/add-product"
            className="btn-outline inline-block rounded-full px-4 py-2.5 font-body text-sm font-bold mt-4"
          >
            Add your first product
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        // Filtered empty — chip has no rows, say it plainly
        <div className="mt-6 border border-dashed border-gray-300 rounded-xl p-10 text-center">
          <p className="font-body text-sm text-passive">
            Nothing in this filter — try another one.
          </p>
        </div>
      ) : (
        // Rows — one card per product, min-w-0 trio everywhere
        <ul className="mt-6 flex flex-col gap-3">
          {filtered.map((p) => (
            <li
              key={p.id}
              className={`border border-black/10 rounded-xl p-3 flex gap-3 items-center overflow-hidden ${
                // Soft-deleted rows gray out — history intact, honesty kept
                p.isActive ? "" : "opacity-60"
              }`}
            >
              {/* Thumb — Cloudinary photo or gray placeholder */}
              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-14 h-14 md:w-16 md:h-16 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center font-header text-gray-400 text-lg">
                  {p.name.charAt(0).toUpperCase()}
                </div>
              )}
              {/* Info — min-w-0 lets text shrink instead of overflowing */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-body font-bold text-sm md:text-base text-gray-900 line-clamp-2">
                    {p.name}
                  </p>
                  {!p.isActive && (
                    <span className="bg-gray-100 text-gray-500 font-body text-xs font-bold rounded-full px-2 py-0.5">
                      Deleted
                    </span>
                  )}
                </div>
                <p className="font-body text-xs text-passive truncate mt-0.5">
                  {p.category?.name} · {p.barangay?.name}
                </p>
                {/* Price + stock — wrap freely on narrow phones */}
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <span className="font-body font-bold text-sm text-primary">
                    ₱{parseFloat(p.price).toFixed(2)}
                  </span>
                  <StockPill stock={p.stock} />
                </div>
              </div>
              {/* Actions — active rows only; deleted rows stay untouched */}
              {p.isActive ? (
                <div className="flex md:flex-col gap-2 shrink-0">
                  <Link
                    to={`/seller/products/${p.id}/edit`}
                    state={{ product: p }}
                    className="btn-outline rounded-full px-3 py-2 font-body text-xs font-bold whitespace-nowrap"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(p)}
                    className="rounded-full px-3 py-2 font-body text-xs font-bold text-danger border border-danger/30 hover:bg-danger/10 whitespace-nowrap"
                  >
                    Delete
                  </button>
                </div>
              ) : (
                <span className="font-body text-xs text-passive shrink-0 hidden md:block">
                  Kept for order history
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Confirm modal — portal + blur + pop, the new house standard */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete product"
        message={`"${deleteTarget?.name}" will be removed from the marketplace. Past orders keep their history.`}
        confirmLabel="Delete"
        busy={busy}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default MyProducts;