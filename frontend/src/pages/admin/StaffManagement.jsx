import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import PageHeader from "../../components/PageHeader.jsx";
import ConfirmModal from "../../components/ConfirmModal.jsx";
import FieldLabel from "../../components/FieldLabel.jsx";
import PasswordInput from "../../components/PasswordInput.jsx";
import Select from "../../components/Select.jsx";
import Spinner from "../../components/Spinner.jsx";
import Icon from "../../components/Icon.jsx";
import { fetchStaff, createStaff, setStaffActive } from "../../api/admin.api.js";
import { fetchBarangays } from "../../api/product.api.js";
import { useAuthStore } from "../../stores/auth.store.js";
import { LEVEL_LABEL } from "../../utils/adminAccess.js";
import Pagination from "../../components/Pagination.jsx";
import { usePaged } from "../../hooks/usePaged.js";

// What each level may do, shown beside the role picker
const LEVEL_HINT = {
  SUPER_ADMIN: "PropeBuy founders. Everything, including money, staff and the activity log.",
  MODERATOR: "Hired PropeBuy staff. Verifications, users, products and orders. No money or staff.",
  BARANGAY_VERIFIER: "Barangay staff. Approves or rejects applicants of one barangay, and sees that barangay's totals. Each barangay has one verifier account.",
};
const LEVEL_OPTIONS = Object.keys(LEVEL_LABEL).map((value) => ({ value, label: LEVEL_LABEL[value] }));
// Empty add form
const BLANK = { name: "", email: "", password: "", adminLevel: "BARANGAY_VERIFIER", barangayId: "" };

// Staff — the super admin adds staff accounts and turns them off or on
// (Yoy, 11-18). Nothing is deleted, so past actions stay in the log.
const StaffManagement = () => {
  const me = useAuthStore((s) => s.user);
  // Staff list, null while loading
  const [staff, setStaff] = useState(null);
  // Active barangays for the verifier picker
  const [barangays, setBarangays] = useState([]);
  // Add form fields and its busy flag
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  // Account waiting for the off/on confirmation, and that call's busy flag
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  // Load — reused after every change
  const load = useCallback(() => {
    fetchStaff()
      .then((res) => setStaff(res.data || []))
      .catch(() => toast.error("Could not load staff accounts"));
  }, []);
  useEffect(() => {
    load();
    fetchBarangays()
      .then((res) => setBarangays(res.data || []))
      .catch(() => {});
  }, [load]);

  // One field of the add form
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const verifier = form.adminLevel === "BARANGAY_VERIFIER";

  // Create the account
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await createStaff({ ...form, barangayId: verifier ? form.barangayId : null });
      toast.success(res.message);
      setForm(BLANK);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not add the staff account");
    } finally {
      setSaving(false);
    }
  };

  // Turn the chosen account off or back on
  const confirmToggle = async () => {
    setBusy(true);
    try {
      const res = await setStaffActive(target.id, target.accountStatus !== "VERIFIED");
      toast.success(res.message);
      setTarget(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update the account");
    } finally {
      setBusy(false);
    }
  };

  // At most 50 rows per page (11-26)
  const paged = usePaged(staff, "");

  return (
    <div className="page-enter">
      <PageHeader
        title="Staff"
        subtitle="Who can use the admin portal, and what each person may do. Give the temporary password in person, never in a group chat."
      />

      {/* ── ADD A STAFF ACCOUNT ── */}
      <form onSubmit={save} className="border border-black/10 rounded-xl p-4 md:p-5 space-y-3">
        <p className="font-body font-bold text-sm flex items-center gap-2">
          <Icon name="person_add" size={20} /> Add a staff account
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="min-w-0">
            <FieldLabel htmlFor="staff-name">Full name</FieldLabel>
            <input id="staff-name" value={form.name} onChange={(e) => set("name")(e.target.value)} maxLength={100} placeholder="Juan Dela Cruz" className="w-full px-5 py-3 font-body text-sm" />
          </div>
          <div className="min-w-0">
            <FieldLabel htmlFor="staff-email">Email</FieldLabel>
            <input id="staff-email" type="email" value={form.email} onChange={(e) => set("email")(e.target.value)} maxLength={120} placeholder="name@example.com" className="w-full px-5 py-3 font-body text-sm" />
          </div>
          <div className="min-w-0">
            <FieldLabel htmlFor="staff-password">Temporary password</FieldLabel>
            <PasswordInput id="staff-password" value={form.password} onChange={(e) => set("password")(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" />
          </div>
          <div className="min-w-0">
            <FieldLabel>Role</FieldLabel>
            <Select value={form.adminLevel} onChange={set("adminLevel")} options={LEVEL_OPTIONS} ariaLabel="Staff role" />
          </div>
          {verifier && (
            <div className="min-w-0">
              <FieldLabel>Barangay they verify</FieldLabel>
              <Select
                value={form.barangayId}
                onChange={set("barangayId")}
                options={[{ value: "", label: "Choose a barangay" }, ...barangays.map((b) => ({ value: b.id, label: b.name }))]}
                ariaLabel="Barangay"
              />
            </div>
          )}
        </div>
        <p className="font-body text-xs text-passive">{LEVEL_HINT[form.adminLevel]}</p>
        <button
          disabled={saving || form.name.trim().length < 2 || !form.email.trim() || form.password.length < 8 || (verifier && !form.barangayId)}
          className="btn-primary btn-active px-6 py-3 font-body text-sm font-medium flex items-center gap-2 disabled:opacity-50"
        >
          {saving && <Spinner />} Add staff account
        </button>
      </form>

      {/* ── STAFF LIST ── */}
      {staff === null ? (
        <div className="mt-6 py-10 flex items-center justify-center gap-3 font-body text-sm text-passive">
          <Spinner /> Loading staff...
        </div>
      ) : (
        <ul className="mt-6 rounded-xl border border-black/10 divide-y divide-black/5">
          {paged.pageItems.map((s) => {
            const on = s.accountStatus === "VERIFIED";
            return (
              <li key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 font-body text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-bold truncate">
                    {s.name}
                    {s.id === me?.id && <span className="font-normal text-passive"> (you)</span>}
                  </p>
                  <p className="text-xs text-passive truncate">{s.email}</p>
                </div>
                {/* Level, plus the barangay of a verifier */}
                <p className="text-xs sm:w-56 min-w-0">
                  <span className="font-bold">{LEVEL_LABEL[s.adminLevel] || "No role"}</span>
                  {s.barangay && <span className="text-passive"> · {s.barangay.name}</span>}
                </p>
                <span className={`text-xs font-bold rounded-full px-3 py-1 w-fit ${on ? "bg-primary text-white" : "bg-surface text-passive"}`}>
                  {on ? "Active" : "Turned off"}
                </span>
                {s.id !== me?.id && (
                  <button onClick={() => setTarget(s)} className="btn-outline btn-active px-4 py-2 text-sm font-medium">
                    {on ? "Turn off" : "Turn on"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <Pagination paged={paged} label="staff accounts" />

      {/* Off logs them out at once; on lets them log in again */}
      <ConfirmModal
        open={!!target}
        tone={target?.accountStatus === "VERIFIED" ? "danger" : "primary"}
        title={target?.accountStatus === "VERIFIED" ? "Turn off this account?" : "Turn this account back on?"}
        message={
          target
            ? target.accountStatus === "VERIFIED"
              ? `${target.name} is logged out now and cannot log in. Their past actions stay in the activity log.`
              : `${target.name} can log in again with their current password.`
            : ""
        }
        confirmLabel={target?.accountStatus === "VERIFIED" ? "Turn off" : "Turn on"}
        busy={busy}
        onConfirm={confirmToggle}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
};

export default StaffManagement;
