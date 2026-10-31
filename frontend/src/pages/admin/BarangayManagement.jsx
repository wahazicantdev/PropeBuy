import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
// Shared pieces
import ConfirmModal from "../../components/ConfirmModal.jsx";
import Spinner from "../../components/Spinner.jsx";
import {
  fetchAdminBarangays,
  addBarangay,
  toggleBarangay,
} from "../../api/admin.api.js";

// BarangayManagement — coverage control for the whole platform.
// Reads /admin/barangays (Phase E route) instead of the public one,
// because the public route filters out disabled rows and a disabled
// barangay would become invisible and impossible to re-enable.
const BarangayManagement = () => {
  // Every barangay, active and disabled, with product + user counts
  const [barangays, setBarangays] = useState([]);
  // Loading flag
  const [loading, setLoading] = useState(true);
  // Toggle target for the modal, plus busy while it runs
  const [toggleTarget, setToggleTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  // Add form — text fields stay in hook-form, house pattern
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
    fetchAdminBarangays()
      .then((res) => setBarangays(res.data || []))
      .catch((err) => toast.error(readError(err, "Failed to load barangays")))
      .finally(() => setLoading(false));
  }, []);

  // First load on mount
  useEffect(() => {
    load();
  }, [load]);

  // ── ADD ──
  // City is optional — backend defaults it to Muntinlupa City
  const onAdd = async (v) => {
    try {
      const res = await addBarangay(v.name.trim(), v.city?.trim() || undefined);
      toast.success(res.message || "Barangay added");
      // Clear the form then refetch so the new row appears sorted
      reset();
      load();
    } catch (err) {
      toast.error(readError(err, "Failed to add barangay"));
    }
  };

  // ── TOGGLE ──
  // Backend flips isActive. Disabling hides the barangay from the
  // register dropdown and the browse filter — existing products and
  // accounts keep their rows, they just stop being discoverable.
  const handleToggle = async () => {
    if (!toggleTarget) return;
    setBusy(true);
    try {
      const res = await toggleBarangay(toggleTarget.id);
      toast.success(res.message || "Barangay updated");
      setToggleTarget(null);
      load();
    } catch (err) {
      toast.error(readError(err, "Toggle failed"));
    } finally {
      setBusy(false);
    }
  };

  // Counts for the header line
  const activeCount = barangays.filter((b) => b.isActive).length;

  return (
    <div className="page-enter">
      {/* Header row */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="font-header font-bold text-xl md:text-2xl text-gray-900">
            Barangay Management
          </h1>
          <p className="font-body text-sm text-passive mt-1">
            {activeCount} active · {barangays.length - activeCount} disabled
          </p>
        </div>
      </div>

      {/* ── ADD FORM ── */}
      {/* Inline card, not a modal — adding is routine, not destructive */}
      <form
        onSubmit={handleSubmit(onAdd)}
        className="mt-4 border border-black/10 rounded-xl p-4"
      >
        <p className="font-body font-bold text-sm text-gray-900">
          Add a barangay
        </p>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <div className="min-w-0">
            <input
              {...register("name", {
                required: "Barangay name is required",
                minLength: { value: 2, message: "At least 2 characters" },
                maxLength: { value: 100, message: "At most 100 characters" },
              })}
              placeholder="Barangay name"
              className="w-full border border-gray-200 rounded-full px-4 py-3 font-body text-sm focus:outline-none focus:border-primary"
            />
            {/* Field error — client rules mirror the express-validator ones */}
            {errors.name && (
              <p className="font-body text-xs text-danger mt-1">
                {errors.name.message}
              </p>
            )}
          </div>
          <div className="min-w-0">
            <input
              {...register("city", {
                minLength: { value: 2, message: "At least 2 characters" },
                maxLength: { value: 100, message: "At most 100 characters" },
              })}
              placeholder="City (defaults to Muntinlupa City)"
              className="w-full border border-gray-200 rounded-full px-4 py-3 font-body text-sm focus:outline-none focus:border-primary"
            />
            {errors.city && (
              <p className="font-body text-xs text-danger mt-1">
                {errors.city.message}
              </p>
            )}
          </div>
          {/* Submit — spinner inside while the request runs */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary rounded-full px-5 py-3 font-body text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {isSubmitting ? (
              <>
                <Spinner />
                Adding...
              </>
            ) : (
              "Add barangay"
            )}
          </button>
        </div>
        <p className="font-body text-xs text-passive mt-2">
          Duplicate names are refused by the database — each barangay name is
          unique.
        </p>
      </form>

      {/* Loading state */}
      {loading ? (
        <div className="py-16 flex items-center justify-center gap-3 font-body text-sm text-passive">
          <Spinner />
          Loading barangays...
        </div>
      ) : barangays.length === 0 ? (
        <div className="mt-6 border border-dashed border-gray-300 rounded-xl p-10 text-center">
          <p className="font-header text-lg text-gray-900">No barangays yet</p>
          <p className="font-body text-sm text-passive mt-1">
            Run the seed script, or add the first barangay above.
          </p>
        </div>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {barangays.map((b) => (
            // Disabled rows gray out — same visual language as removed
            // products, so "switched off" always reads the same way
            <li
              key={b.id}
              className={`border border-black/10 rounded-xl p-4 flex gap-3 items-center overflow-hidden ${
                b.isActive ? "" : "opacity-60"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-body font-bold text-sm md:text-base text-gray-900 truncate">
                    {b.name}
                  </p>
                  {/* State pill — primary when serving, gray when off */}
                  <span
                    className={`font-body text-xs font-bold rounded-full px-3 py-1 ${
                      b.isActive
                        ? "bg-primary text-white"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {b.isActive ? "Active" : "Disabled"}
                  </span>
                </div>
                <p className="font-body text-xs text-passive truncate mt-0.5">
                  {b.city}
                </p>
                {/* Live counts — the context that makes a toggle safe */}
                <p className="font-body text-xs text-passive mt-0.5">
                  {b._count?.products ?? 0} listing
                  {(b._count?.products ?? 0) === 1 ? "" : "s"} ·{" "}
                  {b._count?.users ?? 0} account
                  {(b._count?.users ?? 0) === 1 ? "" : "s"}
                </p>
              </div>
              {/* Toggle — one button, label follows current state */}
              <button
                onClick={() => setToggleTarget(b)}
                className={`rounded-full px-3 py-2 font-body text-xs font-bold whitespace-nowrap shrink-0 ${
                  b.isActive
                    ? "text-danger border border-danger/30 hover:bg-danger/10"
                    : "btn-outline"
                }`}
              >
                {b.isActive ? "Disable" : "Enable"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* ── TOGGLE MODAL ── */}
      {/* tone follows direction: disabling is destructive-ish, enabling
          is not, so the button color never lies about what happens. */}
      <ConfirmModal
        open={!!toggleTarget}
        title={
          toggleTarget?.isActive ? "Disable barangay" : "Enable barangay"
        }
        message={
          toggleTarget?.isActive
            ? `${toggleTarget?.name || ""} will disappear from the register dropdown and the browse filter. Its ${toggleTarget?._count?.products ?? 0} listing(s) and ${toggleTarget?._count?.users ?? 0} account(s) stay in the database untouched — they just stop being discoverable until you enable it again.`
            : `${toggleTarget?.name || ""} goes back into the register dropdown and the browse filter right away.`
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

export default BarangayManagement;
