import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
// Shared pieces
import ConfirmModal from "../../components/ConfirmModal.jsx";
import Spinner from "../../components/Spinner.jsx";
import {
  fetchAdminCategories,
  addCategory,
  toggleCategory,
} from "../../api/admin.api.js";

// CategoryManagement — the 7 documented categories live here.
// Same shape as BarangayManagement on purpose: one mental model for
// both taxonomy pages. Reads /admin/categories so disabled rows stay
// visible and reversible.
const CategoryManagement = () => {
  // Every category, active and disabled, with product counts
  const [categories, setCategories] = useState([]);
  // Loading flag
  const [loading, setLoading] = useState(true);
  // Toggle target plus busy while the request runs
  const [toggleTarget, setToggleTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  // Add form — hook-form for the single text field
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  // Shared error reader — validator array first, else message
  const readError = (err, fallback) =>
    err.response?.data?.errors?.[0]?.message ||
    err.response?.data?.message ||
    fallback;

  // Load — reusable so add and toggle refresh the same way.
  // The spinner is OWNED BY THE CALLER: it starts true for the first
  // paint. Effects must never setState synchronously
  // (react-hooks/set-state-in-effect), and useCallback keeps this
  // stable so the mount effect runs exactly once.
  const load = useCallback(() => {
    fetchAdminCategories()
      .then((res) => setCategories(res.data || []))
      .catch((err) => toast.error(readError(err, "Failed to load categories")))
      .finally(() => setLoading(false));
  }, []);

  // First load on mount
  useEffect(() => {
    load();
  }, [load]);

  // ── ADD ──
  const onAdd = async (v) => {
    try {
      const res = await addCategory(v.name.trim());
      toast.success(res.message || "Category added");
      reset();
      load();
    } catch (err) {
      toast.error(readError(err, "Failed to add category"));
    }
  };

  // ── TOGGLE ──
  // Disabling pulls the category out of the browse filter and the add
  // product dropdown. Products already filed under it keep their row.
  const handleToggle = async () => {
    if (!toggleTarget) return;
    setBusy(true);
    try {
      const res = await toggleCategory(toggleTarget.id);
      toast.success(res.message || "Category updated");
      setToggleTarget(null);
      load();
    } catch (err) {
      toast.error(readError(err, "Toggle failed"));
    } finally {
      setBusy(false);
    }
  };

  // Counts for the header line
  const activeCount = categories.filter((c) => c.isActive).length;

  return (
    <div className="page-enter">
      {/* Header row */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="font-header font-bold text-xl md:text-2xl text-gray-900">
            Category Management
          </h1>
          <p className="font-body text-sm text-passive mt-1">
            {activeCount} active · {categories.length - activeCount} disabled
          </p>
        </div>
      </div>

      {/* Scope reminder — physical deliverable goods only, straight from
          the documentation. Stops a new admin inviting services in. */}
      <p className="mt-4 font-body text-xs text-passive border border-gray-100 rounded-xl p-3">
        PropeBuy carries physical deliverable goods only. Services, dine-in
        food and fresh palengke produce are out of scope — the 7 seeded
        categories match the documentation.
      </p>

      {/* ── ADD FORM ── */}
      <form
        onSubmit={handleSubmit(onAdd)}
        className="mt-3 border border-gray-100 rounded-xl p-4"
      >
        <p className="font-body font-bold text-sm text-gray-900">
          Add a category
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <input
              {...register("name", {
                required: "Category name is required",
                minLength: { value: 2, message: "At least 2 characters" },
                maxLength: { value: 100, message: "At most 100 characters" },
              })}
              placeholder="Category name"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 font-body text-sm focus:outline-none focus:border-primary"
            />
            {/* Client rules mirror the express-validator ones */}
            {errors.name && (
              <p className="font-body text-xs text-danger mt-1">
                {errors.name.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary rounded-lg px-5 py-3 font-body text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {isSubmitting ? (
              <>
                <Spinner />
                Adding...
              </>
            ) : (
              "Add category"
            )}
          </button>
        </div>
        <p className="font-body text-xs text-passive mt-2">
          Duplicate names are refused by the database — each category name is
          unique.
        </p>
      </form>

      {/* Loading state */}
      {loading ? (
        <div className="py-16 flex items-center justify-center gap-3 font-body text-sm text-passive">
          <Spinner />
          Loading categories...
        </div>
      ) : categories.length === 0 ? (
        <div className="mt-6 border border-dashed border-gray-300 rounded-xl p-10 text-center">
          <p className="font-header text-lg text-gray-900">
            No categories yet
          </p>
          <p className="font-body text-sm text-passive mt-1">
            Run the seed script to load the 7 documented categories.
          </p>
        </div>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {categories.map((c) => (
            // Disabled rows gray out — same language as barangays
            <li
              key={c.id}
              className={`border border-gray-100 rounded-xl p-4 flex gap-3 items-center overflow-hidden ${
                c.isActive ? "" : "opacity-60"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-body font-bold text-sm md:text-base text-gray-900 line-clamp-2">
                    {c.name}
                  </p>
                  <span
                    className={`font-body text-xs font-bold rounded-full px-3 py-1 ${
                      c.isActive
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {c.isActive ? "Active" : "Disabled"}
                  </span>
                </div>
                {/* Product count — the context that makes a toggle safe */}
                <p className="font-body text-xs text-passive mt-0.5">
                  {c._count?.products ?? 0} listing
                  {(c._count?.products ?? 0) === 1 ? "" : "s"}
                </p>
              </div>
              <button
                onClick={() => setToggleTarget(c)}
                className={`rounded-lg px-3 py-2 font-body text-xs font-bold whitespace-nowrap shrink-0 ${
                  c.isActive
                    ? "text-danger border border-danger/30 hover:bg-danger/10"
                    : "btn-outline"
                }`}
              >
                {c.isActive ? "Disable" : "Enable"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ── TOGGLE MODAL ── */}
      <ConfirmModal
        open={!!toggleTarget}
        title={
          toggleTarget?.isActive ? "Disable category" : "Enable category"
        }
        message={
          toggleTarget?.isActive
            ? `${toggleTarget?.name || ""} will disappear from the browse filter and the vendor's add-product dropdown. Its ${toggleTarget?._count?.products ?? 0} listing(s) stay in the database — they just stop being discoverable until you enable it again.`
            : `${toggleTarget?.name || ""} goes back into the browse filter and the add-product dropdown right away.`
        }
        confirmLabel={toggleTarget?.isActive ? "Disable" : "Enable"}
        tone={toggleTarget?.isActive ? "danger" : "primary"}
        size="md"
        busy={busy}
        onConfirm={handleToggle}
        onCancel={() => setToggleTarget(null)}
      />
    </div>
  );
};

export default CategoryManagement;
