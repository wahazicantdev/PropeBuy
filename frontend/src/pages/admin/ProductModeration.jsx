import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
// Shared pieces
import StockPill from "../../components/StockPill.jsx";
import { AccountPill } from "../../components/AdminPills.jsx";
import ConfirmModal from "../../components/ConfirmModal.jsx";
import Select from "../../components/Select.jsx";
import Spinner from "../../components/Spinner.jsx";
import { fetchAllProducts, removeProduct } from "../../api/admin.api.js";
import { fetchBarangays, fetchCategories } from "../../api/product.api.js";

// ProductModeration — every listing on the platform, live and removed.
// Removal is a SOFT delete (isActive false): the row stays in the
// database so past orders keep their history, which is exactly why
// removed rows are still listed here, grayed out.
const ProductModeration = () => {
  // Rows for the active filters
  const [products, setProducts] = useState([]);
  // Filter dropdown sources
  const [barangays, setBarangays] = useState([]);
  const [categories, setCategories] = useState([]);
  // Server-side filters — empty string means "do not send"
  const [barangayId, setBarangayId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isActive, setIsActive] = useState("");
  // Client-side name search — no search param on the admin route
  const [search, setSearch] = useState("");
  // Loading flag
  const [loading, setLoading] = useState(true);
  // Removal target plus the mandatory reason text
  const [removeTarget, setRemoveTarget] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  // Shared error reader — validator array first, else message
  const readError = (err, fallback) =>
    err.response?.data?.errors?.[0]?.message ||
    err.response?.data?.message ||
    fallback;

  // Load rows — refetches on every server-side filter change.
  // No setLoading(true) in here: an effect body must not setState
  // synchronously (react-hooks/set-state-in-effect). The spinner is
  // true on first paint and each filter handler flips it on itself.
  useEffect(() => {
    fetchAllProducts({ barangayId, categoryId, isActive })
      .then((res) => setProducts(res.data || []))
      .catch((err) => toast.error(readError(err, "Failed to load products")))
      .finally(() => setLoading(false));
  }, [barangayId, categoryId, isActive]);

  // Filter options load once — public endpoints, active rows only,
  // which is correct here: you filter by barangays still in service
  useEffect(() => {
    fetchBarangays()
      .then((res) => setBarangays(res.data || []))
      .catch(() => toast.error("Failed to load barangays"));
    fetchCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => toast.error("Failed to load categories"));
  }, []);

  // Reload keeping the current filters — used after a removal
  const reload = () => {
    fetchAllProducts({ barangayId, categoryId, isActive })
      .then((res) => setProducts(res.data || []))
      .catch((err) => toast.error(readError(err, "Failed to reload")));
  };

  // ── REMOVE ──
  // Reason is required server-side. We block the button until it is
  // typed so the admin never eats a 400 for a missing field.
  const handleRemove = async () => {
    if (!removeTarget) return;
    if (!reason.trim()) return toast.error("Type a reason first");
    setBusy(true);
    try {
      const res = await removeProduct(removeTarget.id, reason.trim());
      toast.success(res.message || "Listing removed");
      // Close, clear the slot, refetch — the row returns grayed out
      setRemoveTarget(null);
      setReason("");
      reload();
    } catch (err) {
      toast.error(readError(err, "Removal failed"));
    } finally {
      setBusy(false);
    }
  };

  // Visible rows — server filtered, search applied locally
  const visible = products.filter((p) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.seller?.name || "").toLowerCase().includes(q)
    );
  });

  // Counts for the header line — honest split of live versus removed
  const liveCount = products.filter((p) => p.isActive).length;
  const removedCount = products.length - liveCount;

  return (
    <div className="page-enter">
      {/* Header row */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="font-header font-bold text-xl md:text-2xl text-gray-900">
            Product Moderation
          </h1>
          <p className="font-body text-sm text-passive mt-1">
            {liveCount} live · {removedCount} removed
          </p>
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="min-w-0">
          <label className="font-body text-xs font-bold text-gray-900 block mb-1.5">
            Barangay
          </label>
          <Select
            value={barangayId}
            onChange={(v) => {
              // Spinner on at the tap, off in the effect's .finally()
              setLoading(true);
              setBarangayId(v);
            }}
            ariaLabel="Filter by barangay"
            options={[
              { value: "", label: "All barangays" },
              // ids as values, never names — admins can rename barangays
              ...barangays.map((b) => ({
                value: String(b.id),
                label: b.name,
              })),
            ]}
          />
        </div>
        <div className="min-w-0">
          <label className="font-body text-xs font-bold text-gray-900 block mb-1.5">
            Category
          </label>
          <Select
            value={categoryId}
            onChange={(v) => {
              setLoading(true);
              setCategoryId(v);
            }}
            ariaLabel="Filter by category"
            options={[
              { value: "", label: "All categories" },
              ...categories.map((c) => ({
                value: String(c.id),
                label: c.name,
              })),
            ]}
          />
        </div>
        <div className="min-w-0">
          <label className="font-body text-xs font-bold text-gray-900 block mb-1.5">
            Listing state
          </label>
          {/* Strings on purpose — the backend compares against "true" */}
          <Select
            value={isActive}
            onChange={(v) => {
              setLoading(true);
              setIsActive(v);
            }}
            ariaLabel="Filter by listing state"
            options={[
              { value: "", label: "Live and removed" },
              { value: "true", label: "Live only" },
              { value: "false", label: "Removed only" },
            ]}
          />
        </div>
        <div className="min-w-0">
          <label className="font-body text-xs font-bold text-gray-900 block mb-1.5">
            Search
          </label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Product or vendor"
            className="w-full border border-gray-200 rounded-lg px-4 py-3 font-body text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-16 flex items-center justify-center gap-3 font-body text-sm text-passive">
          <Spinner />
          Loading listings...
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-6 border border-dashed border-gray-300 rounded-xl p-10 text-center">
          <p className="font-body text-sm text-passive">
            {products.length === 0
              ? "No listings match these filters."
              : "No listings match your search."}
          </p>
        </div>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {visible.map((p) => (
            // Removed rows gray out — history intact, honesty kept
            <li
              key={p.id}
              className={`border border-gray-100 rounded-xl p-3 flex gap-3 items-start overflow-hidden ${
                p.isActive ? "" : "opacity-60"
              }`}
            >
              {/* Thumb — Cloudinary photo or letter fallback */}
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
                      Removed
                    </span>
                  )}
                </div>
                <p className="font-body text-xs text-passive truncate mt-0.5">
                  {p.category?.name} · {p.barangay?.name}
                </p>
                {/* Vendor line — status pill flags unverified sellers */}
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <span className="font-body text-xs text-gray-700 truncate">
                    by {p.seller?.name || "Unknown vendor"}
                  </span>
                  <AccountPill status={p.seller?.accountStatus} />
                </div>
                {/* Price + stock — wrap freely on narrow phones */}
                <div className="flex items-center gap-2 flex-wrap mt-1">
                  <span className="font-body font-bold text-sm text-primary">
                    ₱{parseFloat(p.price).toFixed(2)}
                  </span>
                  <StockPill stock={p.stock} />
                </div>
              </div>
              {/* Actions — view the public page, or pull the listing */}
              <div className="flex md:flex-col gap-2 shrink-0">
                {/* Public detail page — only live rows are reachable there */}
                {p.isActive && (
                  <Link
                    to={`/product/${p.id}`}
                    className="btn-outline rounded-lg px-3 py-2 font-body text-xs font-bold whitespace-nowrap"
                  >
                    View
                  </Link>
                )}
                {p.isActive ? (
                  <button
                    onClick={() => {
                      // Fresh reason every time — never reuse the last one
                      setReason("");
                      setRemoveTarget(p);
                    }}
                    className="rounded-lg px-3 py-2 font-body text-xs font-bold text-danger border border-danger/30 hover:bg-danger/10 whitespace-nowrap"
                  >
                    Remove
                  </button>
                ) : (
                  <span className="font-body text-xs text-passive hidden md:block whitespace-nowrap">
                    Kept for history
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* ── REMOVE MODAL ── */}
      {/* The reason textarea rides in the children slot and gates the
          confirm button, mirroring the server's required-field rule. */}
      <ConfirmModal
        open={!!removeTarget}
        title="Remove listing"
        message={`"${removeTarget?.name || ""}" by ${removeTarget?.seller?.name || "the vendor"} will disappear from the marketplace. Past orders keep their history.`}
        confirmLabel="Remove listing"
        size="md"
        busy={busy}
        confirmDisabled={!reason.trim()}
        onConfirm={handleRemove}
        onCancel={() => {
          setRemoveTarget(null);
          setReason("");
        }}
      >
        <label className="font-body text-xs font-bold text-gray-900 block mb-2">
          Reason for removal (required)
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Example: prohibited item, not a physical good, misleading photo"
          className="w-full border border-gray-200 rounded-lg px-4 py-3 font-body text-sm focus:outline-none focus:border-primary resize-none"
        />
        <p className="font-body text-xs text-passive mt-2">
          The reason is returned in the API response for the record. Vendor
          notification by email is not built yet.
        </p>
      </ConfirmModal>
    </div>
  );
};

export default ProductModeration;
