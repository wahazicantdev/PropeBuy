import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
// Shared pieces — pill, modal, spinner all built in STEP 3
import StockPill from "../../components/StockPill.jsx";
import ConfirmModal from "../../components/ConfirmModal.jsx";
import Spinner from "../../components/Spinner.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import FilterChips from "../../components/FilterChips.jsx";
import Thumb from "../../components/Thumb.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import Icon from "../../components/Icon.jsx";
import { fetchMyProducts, deleteProduct } from "../../api/product.api.js";
import { formatPeso } from "../../utils/format.js";
import Pagination from "../../components/Pagination.jsx";
import { usePaged } from "../../hooks/usePaged.js";

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
  // Name search, matched on the client
  const [query, setQuery] = useState("");

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
  const q = query.trim().toLowerCase();
  const filtered = products.filter((p) => {
    if (q && !p.name.toLowerCase().includes(q)) return false;
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
  // At most 50 rows per page (11-26)
  const paged = usePaged(filtered, "");

  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center gap-3 font-body text-sm text-passive">
        <Spinner />
        Loading your products...
      </div>
    );
  }

  // Edit and delete buttons — shared by the table and the phone cards
  const actions = (p) =>
    p.isActive ? (
      <div className="flex gap-1.5 justify-end">
        <Link
          to={`/seller/products/${p.id}/edit`}
          state={{ product: p }}
          aria-label={`Edit ${p.name}`}
          className="btn-outline w-9 h-9 flex items-center justify-center"
        >
          <Icon name="edit" size={18} />
        </Link>
        <button
          onClick={() => setDeleteTarget(p)}
          aria-label={`Delete ${p.name}`}
          className="w-9 h-9 rounded-full border border-danger/30 text-danger flex items-center justify-center hover:bg-danger/10"
        >
          <Icon name="delete" size={18} />
        </button>
      </div>
    ) : (
      <span className="font-body text-xs text-passive">Kept for order history</span>
    );

  return (
    <div className="page-enter">
      <PageHeader
        title="My products"
        subtitle={`${products.length} ${products.length === 1 ? "listing" : "listings"}`}
        actions={
          <Link to="/seller/add-product" className="btn-primary btn-active px-5 py-2.5 font-body text-sm font-medium flex items-center gap-1.5">
            <Icon name="add" size={18} /> Add product
          </Link>
        }
      />

      {/* Filters and search */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <FilterChips
          value={filter}
          onChange={setFilter}
          options={[
            { key: "ALL", label: "All", count: counts.ALL },
            { key: "ACTIVE", label: "Active", count: counts.ACTIVE },
            { key: "LOW", label: "Low stock", count: counts.LOW },
            { key: "DELETED", label: "Deleted", count: counts.DELETED },
          ]}
        />
        <div className="relative md:w-72">
          <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products"
            aria-label="Search products"
            className="w-full pl-11 pr-4 py-2.5 font-body text-sm"
          />
        </div>
      </div>

      <div className="mt-5">
        {products.length === 0 ? (
          <EmptyState
            title="No products yet"
            text="Add your first product so buyers can find you."
            action={<Link to="/seller/add-product" className="btn-primary inline-block px-5 py-2.5 font-body text-sm font-medium">Add your first product</Link>}
          />
        ) : filtered.length === 0 ? (
          <EmptyState icon="search" title="Nothing here" text="Try another filter or search word." />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block rounded-xl border border-black/10 overflow-hidden">
              <table className="w-full font-body text-sm">
                <thead className="bg-surface text-left text-xs text-passive">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium text-right">Price</th>
                    <th className="px-4 py-3 font-medium">Stock</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paged.pageItems.map((p) => (
                    <tr key={p.id} className={`border-t border-black/5 ${p.isActive ? "" : "opacity-55"}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Thumb src={p.imageUrl} alt={p.name} size="w-12 h-12" />
                          <div className="min-w-0">
                            <p className="font-semibold text-black truncate max-w-[22rem]">
                              {p.name}
                              {!p.isActive && <span className="ml-2 rounded-full bg-surface px-2 py-0.5 text-[11px] text-black/50">Deleted</span>}
                            </p>
                            <p className="text-xs text-passive truncate">{p.category?.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatPeso(p.price)}</td>
                      <td className="px-4 py-3"><StockPill stock={p.stock} /></td>
                      <td className="px-4 py-3 text-right">{actions(p)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Phone cards */}
            <ul className="md:hidden flex flex-col gap-2.5">
              {paged.pageItems.map((p) => (
                <li key={p.id} className={`rounded-xl border border-black/10 p-3 flex items-center gap-3 ${p.isActive ? "" : "opacity-55"}`}>
                  <Thumb src={p.imageUrl} alt={p.name} />
                  <div className="min-w-0 flex-1">
                    <p className="font-body font-semibold text-sm text-black line-clamp-2">{p.name}</p>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <span className="font-body font-bold text-sm tabular-nums">{formatPeso(p.price)}</span>
                      <StockPill stock={p.stock} />
                    </div>
                  </div>
                  <div className="shrink-0">{actions(p)}</div>
                </li>
              ))}
            </ul>
          </>
        )}
        <Pagination paged={paged} label="products" />
      </div>

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