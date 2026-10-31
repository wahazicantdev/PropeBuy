import { useEffect, useState } from "react";
import toast from "react-hot-toast";
// Shared pieces
import { AccountPill, RolePill, OcrPill } from "../../components/AdminPills.jsx";
import ConfirmModal from "../../components/ConfirmModal.jsx";
import Select from "../../components/Select.jsx";
import Spinner from "../../components/Spinner.jsx";
import VerifiedBadge from "../../components/VerifiedBadge.jsx";
import { fetchUsers, fetchUser, suspendUser } from "../../api/admin.api.js";
import { useAuthStore } from "../../stores/auth.store.js";

// UserManagement — the full account directory.
// Role and status filters are SERVER-side (the backend accepts ?role and
// ?status), so changing a dropdown refetches instead of slicing a stale
// list. Search is client-side because no search param exists server-side.
const UserManagement = () => {
  // Rows for the current filter combination
  const [users, setUsers] = useState([]);
  // Filters — empty string means "no filter sent"
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  // Name or email search — client-side over the fetched rows
  const [search, setSearch] = useState("");
  // Loading flag
  const [loading, setLoading] = useState(true);
  // Suspend target for the modal, plus busy while it runs
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  // Expanded row — detail is fetched on demand, not with the list
  const [detailId, setDetailId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  // Logged-in admin — used to hide suspend on your own row
  const me = useAuthStore((s) => s.user);

  // Shared error reader — validator array first, else message
  const readError = (err, fallback) =>
    err.response?.data?.errors?.[0]?.message ||
    err.response?.data?.message ||
    fallback;

  // Load rows for the active filters — refetches whenever they change.
  // No setLoading(true) in here: an effect body must not setState
  // synchronously (react-hooks/set-state-in-effect). The spinner is
  // true on first paint and each filter handler flips it on itself.
  useEffect(() => {
    fetchUsers({ role, status })
      .then((res) => setUsers(res.data || []))
      .catch((err) => toast.error(readError(err, "Failed to load users")))
      .finally(() => setLoading(false));
    // Re-run on every filter change — server does the filtering
  }, [role, status]);

  // Manual reload after a suspend, keeping the current filters
  const reload = () => {
    fetchUsers({ role, status })
      .then((res) => setUsers(res.data || []))
      .catch((err) => toast.error(readError(err, "Failed to reload users")));
  };

  // ── SUSPEND ──
  // Backend flips accountStatus to REJECTED and refuses two cases:
  // suspending yourself, and suspending another admin.
  const handleSuspend = async () => {
    if (!suspendTarget) return;
    setBusy(true);
    try {
      const res = await suspendUser(suspendTarget.id);
      toast.success(res.message || "User suspended");
      setSuspendTarget(null);
      reload();
    } catch (err) {
      toast.error(readError(err, "Suspend failed"));
    } finally {
      setBusy(false);
    }
  };

  // ── TOGGLE DETAIL ──
  // Tap once to load documents plus listings, tap again to close
  const toggleDetail = async (id) => {
    if (detailId === id) {
      setDetailId(null);
      setDetailData(null);
      return;
    }
    setDetailId(id);
    setDetailData(null);
    setDetailLoading(true);
    try {
      const res = await fetchUser(id);
      setDetailData(res.data);
    } catch (err) {
      toast.error(readError(err, "Failed to load user detail"));
      setDetailId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // Visible rows — server already filtered role and status, search is ours
  const visible = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (
      u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-enter">
      {/* Header row */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="font-header font-bold text-xl md:text-2xl text-gray-900">
            User Management
          </h1>
          <p className="font-body text-sm text-passive mt-1">
            {users.length} account{users.length === 1 ? "" : "s"} in this view
          </p>
        </div>
      </div>

      {/* ── FILTER BAR ── */}
      {/* Two server filters plus one local search, stacked on phone */}
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="min-w-0">
          <label className="font-body text-xs font-bold text-gray-900 block mb-1.5">
            Role
          </label>
          <Select
            value={role}
            onChange={(v) => {
              // Spinner on at the tap, off in the effect's .finally()
              setLoading(true);
              setRole(v);
            }}
            ariaLabel="Filter by role"
            options={[
              { value: "", label: "All roles" },
              { value: "BUYER", label: "Buyers" },
              { value: "SELLER", label: "Vendors" },
              { value: "ADMIN", label: "Admins" },
            ]}
          />
        </div>
        <div className="min-w-0">
          <label className="font-body text-xs font-bold text-gray-900 block mb-1.5">
            Status
          </label>
          <Select
            value={status}
            onChange={(v) => {
              setLoading(true);
              setStatus(v);
            }}
            ariaLabel="Filter by status"
            options={[
              { value: "", label: "All statuses" },
              { value: "VERIFIED", label: "Verified" },
              { value: "PENDING", label: "Pending" },
              { value: "REJECTED", label: "Rejected" },
            ]}
          />
        </div>
        <div className="min-w-0">
          <label className="font-body text-xs font-bold text-gray-900 block mb-1.5">
            Search
          </label>
          {/* Client-side — the backend has no search param on users */}
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or email"
            className="w-full border border-gray-200 rounded-lg px-4 py-3 font-body text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Loading state — replaces the list only, filters stay usable */}
      {loading ? (
        <div className="py-16 flex items-center justify-center gap-3 font-body text-sm text-passive">
          <Spinner />
          Loading accounts...
        </div>
      ) : visible.length === 0 ? (
        // Empty — honest about which of the two reasons applies
        <div className="mt-6 border border-dashed border-gray-300 rounded-xl p-10 text-center">
          <p className="font-body text-sm text-passive">
            {users.length === 0
              ? "No accounts match these filters."
              : "No accounts match your search."}
          </p>
        </div>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {visible.map((u) => {
            // Your own row — the backend refuses self-suspend, so the
            // button never renders instead of failing after a tap
            const isMe = me?.id === u.id;
            // Admins are protected server-side too
            const isAdmin = u.role === "ADMIN";
            return (
              <li
                key={u.id}
                className="border border-gray-100 rounded-xl p-4 overflow-hidden"
              >
                {/* Identity row */}
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-body font-bold text-sm md:text-base text-gray-900 line-clamp-2">
                        {u.name}
                      </p>
                      {isMe && (
                        <span className="bg-primary/10 text-primary font-body text-xs font-bold rounded-full px-2 py-0.5">
                          You
                        </span>
                      )}
                    </div>
                    <p className="font-body text-xs text-passive truncate mt-0.5">
                      {u.email}
                    </p>
                    <p className="font-body text-xs text-passive mt-0.5">
                      {u.barangay?.name || "No barangay"} · joined{" "}
                      {new Date(u.createdAt).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                    {/* Verified vendors carry the badge — UI rule, every
                        surface that shows a seller shows the badge */}
                    {u.role === "SELLER" && u.accountStatus === "VERIFIED" && (
                      <div className="mt-1.5">
                        <VerifiedBadge />
                      </div>
                    )}
                  </div>
                  {/* Pills */}
                  <div className="flex gap-2 flex-wrap shrink-0">
                    <RolePill role={u.role} />
                    <AccountPill status={u.accountStatus} />
                  </div>
                </div>

                {/* Action row */}
                <div className="mt-3 flex gap-2 flex-wrap">
                  <button
                    onClick={() => toggleDetail(u.id)}
                    className="btn-active border border-gray-200 rounded-lg px-3 py-2 font-body text-xs font-bold text-gray-900"
                  >
                    {detailId === u.id ? "Hide details" : "View details"}
                  </button>
                  {/* Suspend — hidden on your own row and on admins,
                      matching the two server-side refusals exactly */}
                  {!isMe && !isAdmin && u.accountStatus !== "REJECTED" && (
                    <button
                      onClick={() => setSuspendTarget(u)}
                      className="rounded-lg px-3 py-2 font-body text-xs font-bold text-danger border border-danger/30 hover:bg-danger/10"
                    >
                      Suspend
                    </button>
                  )}
                  {/* Already rejected — say why no button, no dead clicks */}
                  {u.accountStatus === "REJECTED" && (
                    <span className="font-body text-xs text-passive self-center">
                      Already suspended or rejected
                    </span>
                  )}
                </div>

                {/* Detail drawer — documents, OCR verdict, live listings */}
                {detailId === u.id && (
                  <div className="mt-3 border border-gray-100 rounded-lg bg-gray-50 p-3 overflow-hidden">
                    {detailLoading ? (
                      <p className="flex items-center gap-2 font-body text-xs text-passive">
                        <Spinner />
                        Loading details...
                      </p>
                    ) : (
                      <>
                        {/* OCR verdict on file — audit trail for disputes */}
                        <div className="flex gap-2 flex-wrap items-center">
                          <span className="font-body text-xs font-bold text-gray-900">
                            Verification on file:
                          </span>
                          <OcrPill
                            result={detailData?.ocrResult}
                            confidence={detailData?.ocrConfidence}
                          />
                        </div>
                        {/* Issues the engine recorded, if any */}
                        {detailData?.ocrIssues?.length > 0 && (
                          <ul className="mt-2 flex flex-col gap-1">
                            {detailData.ocrIssues.map((issue, i) => (
                              <li
                                key={i}
                                className="font-body text-xs text-gray-700 wrap-break-word"
                              >
                                · {issue}
                              </li>
                            ))}
                          </ul>
                        )}
                        {/* Documents — open in a new tab */}
                        <div className="mt-3 flex gap-2 flex-wrap">
                          {detailData?.idDocumentUrl && (
                            <a
                              href={detailData.idDocumentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-outline rounded-lg px-3 py-2 font-body text-xs font-bold"
                            >
                              Government ID
                            </a>
                          )}
                          {detailData?.certDocumentUrl && (
                            <a
                              href={detailData.certDocumentUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn-outline rounded-lg px-3 py-2 font-body text-xs font-bold"
                            >
                              Barangay certificate
                            </a>
                          )}
                          {!detailData?.idDocumentUrl &&
                            !detailData?.certDocumentUrl && (
                              <span className="font-body text-xs text-passive">
                                No documents on file.
                              </span>
                            )}
                        </div>
                        {/* Live listings — only sellers have these */}
                        <p className="mt-3 font-body text-xs font-bold text-gray-900">
                          Active listings ({detailData?.products?.length || 0})
                        </p>
                        {detailData?.products?.length > 0 ? (
                          <ul className="mt-1.5 flex flex-col gap-1">
                            {detailData.products.map((p) => (
                              <li
                                key={p.id}
                                className="font-body text-xs text-gray-700 flex justify-between gap-3 min-w-0"
                              >
                                <span className="truncate">{p.name}</span>
                                <span className="shrink-0">
                                  ₱{parseFloat(p.price).toFixed(2)} ·{" "}
                                  {p.stock} left
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="font-body text-xs text-passive mt-1">
                            None listed right now.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* ── SUSPEND MODAL ── */}
      {/* Honest copy: suspend reuses REJECTED, there is no separate
          SUSPENDED status in the schema, and no un-suspend endpoint. */}
      <ConfirmModal
        open={!!suspendTarget}
        title="Suspend account"
        message={`${suspendTarget?.name || ""} will be marked rejected and locked out of the platform. Their listings stay in order history. There is no un-suspend endpoint yet — this is a one-way action for now.`}
        confirmLabel="Suspend"
        size="md"
        busy={busy}
        onConfirm={handleSuspend}
        onCancel={() => setSuspendTarget(null)}
      />
    </div>
  );
};

export default UserManagement;
