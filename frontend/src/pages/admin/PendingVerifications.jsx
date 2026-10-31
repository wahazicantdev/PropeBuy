import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
// Shared pieces — pills, modal, spinner, all house standard
import { AccountPill, RolePill, OcrPill } from "../../components/AdminPills.jsx";
import ConfirmModal from "../../components/ConfirmModal.jsx";
import Select from "../../components/Select.jsx";
import Spinner from "../../components/Spinner.jsx";
import {
  fetchPendingVerifications,
  fetchUserOCRDetails,
  rerunUserOCR,
  verifyUser,
} from "../../api/admin.api.js";
import { fetchBarangays } from "../../api/product.api.js";

// PendingVerifications — the blocking queue of the whole platform.
// A vendor cannot list goods until an admin clears them here, so this
// page is OCR-assisted with a manual fallback: the engine recommends,
// the human decides, and the decision is always the human's.
const PendingVerifications = () => {
  // Pending users — backend already parsed ocrIssues + ocrExtractedData
  const [users, setUsers] = useState([]);
  // Active barangays — the approve dropdown assigns one of these
  const [barangays, setBarangays] = useState([]);
  // Loading flag until the first fetch settles
  const [loading, setLoading] = useState(true);

  // ── MODAL TARGETS ──
  // One state per flow so two modals can never fight over the same row
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  // Barangay picked inside the approve modal — seeded from the claim
  const [approveBarangayId, setApproveBarangayId] = useState("");
  // Busy while approve or reject runs
  const [busy, setBusy] = useState(false);

  // ── OCR AUDIT DRAWER ──
  // Expanded row id plus its loaded detail, so the full audit trail
  // opens inline without leaving the queue
  const [auditId, setAuditId] = useState(null);
  const [auditData, setAuditData] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);
  // Re-run OCR in flight for this user id — slow call, needs a spinner
  const [rerunId, setRerunId] = useState(null);

  // Shared error reader — validator array first, else message
  const readError = (err, fallback) =>
    err.response?.data?.errors?.[0]?.message ||
    err.response?.data?.message ||
    fallback;

  // Load the queue — reusable so every action refreshes the same way.
  // The spinner is OWNED BY THE CALLER: it starts true for the first
  // paint and Refresh flips it on before calling. Effects must never
  // setState synchronously (react-hooks/set-state-in-effect), and
  // useCallback keeps this stable so the mount effect runs once.
  const load = useCallback(() => {
    fetchPendingVerifications()
      .then((res) => setUsers(res.data || []))
      .catch((err) => toast.error(readError(err, "Failed to load queue")))
      .finally(() => setLoading(false));
  }, []);

  // First load — queue plus the barangay options for approvals
  useEffect(() => {
    load();
    fetchBarangays()
      .then((res) => setBarangays(res.data || []))
      // Soft failure: approve still works if the admin picks manually later
      .catch(() => toast.error("Failed to load barangay list"));
  }, [load]);

  // ── OPEN APPROVE MODAL ──
  // Seeds the dropdown with the barangay the user CLAIMED at register,
  // so the common case is one tap. Admin can still override it.
  const openApprove = (u) => {
    setApproveBarangayId(u.barangay?.id ? String(u.barangay.id) : "");
    setApproveTarget(u);
  };

  // ── APPROVE ──
  // barangayId is required server-side, so block the call without one
  const handleApprove = async () => {
    if (!approveTarget) return;
    if (!approveBarangayId) return toast.error("Pick a barangay first");
    setBusy(true);
    try {
      const res = await verifyUser(approveTarget.id, "approve", approveBarangayId);
      toast.success(res.message || "User approved");
      // Close then refetch — the row leaves the queue on its own
      setApproveTarget(null);
      load();
    } catch (err) {
      toast.error(readError(err, "Approve failed"));
    } finally {
      setBusy(false);
    }
  };

  // ── REJECT ──
  // No barangay needed — backend only flips status to REJECTED
  const handleReject = async () => {
    if (!rejectTarget) return;
    setBusy(true);
    try {
      const res = await verifyUser(rejectTarget.id, "reject");
      toast.success(res.message || "User rejected");
      setRejectTarget(null);
      load();
    } catch (err) {
      toast.error(readError(err, "Reject failed"));
    } finally {
      setBusy(false);
    }
  };

  // ── TOGGLE OCR AUDIT ──
  // Tap once to load and open, tap again to close. Fetched on demand so
  // the queue stays fast with many pending rows.
  const toggleAudit = async (id) => {
    // Second tap on the same row closes it
    if (auditId === id) {
      setAuditId(null);
      setAuditData(null);
      return;
    }
    setAuditId(id);
    setAuditData(null);
    setAuditLoading(true);
    try {
      const res = await fetchUserOCRDetails(id);
      setAuditData(res.data);
    } catch (err) {
      toast.error(readError(err, "Failed to load OCR details"));
      setAuditId(null);
    } finally {
      setAuditLoading(false);
    }
  };

  // ── RE-RUN OCR ──
  // Backend re-downloads both documents from Cloudinary and runs
  // Tesseract again. Slow on purpose — never fire it twice at once.
  const handleRerun = async (id) => {
    setRerunId(id);
    try {
      const res = await rerunUserOCR(id);
      toast.success(
        `OCR re-run done — ${res.data.ocrResult} at ${res.data.ocrConfidence}%`,
      );
      // Refresh the queue so the new pill shows, and drop a stale audit
      setAuditId(null);
      setAuditData(null);
      load();
    } catch (err) {
      toast.error(readError(err, "OCR re-run failed"));
    } finally {
      setRerunId(null);
    }
  };

  // Barangay options for the custom Select — ids, never names
  const barangayOptions = [
    { value: "", label: "Select barangay" },
    ...barangays.map((b) => ({ value: String(b.id), label: b.name })),
  ];

  // Loading state
  if (loading) {
    return (
      <div className="py-16 flex items-center justify-center gap-3 font-body text-sm text-passive">
        <Spinner />
        Loading verification queue...
      </div>
    );
  }

  return (
    <div className="page-enter">
      {/* Header row */}
      <div className="flex items-start gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="font-header font-bold text-xl md:text-2xl text-gray-900">
            Pending Verifications
          </h1>
          <p className="font-body text-sm text-passive mt-1">
            {users.length} registration{users.length === 1 ? "" : "s"} waiting
            on a decision
          </p>
        </div>
        {/* Manual refresh — the queue is a snapshot, not a live feed */}
        <button
          onClick={() => {
            setLoading(true);
            load();
          }}
          className="btn-active ml-auto border border-gray-200 rounded-lg px-3 py-2 font-body text-xs font-bold text-gray-900"
        >
          Refresh
        </button>
      </div>

      {/* How-to strip — OCR recommends, human decides. Says the policy
          out loud so a panelist reading the screen gets the framing. */}
      <p className="mt-4 font-body text-xs text-passive border border-gray-100 rounded-xl p-3">
        OCR reads both documents and recommends a result. You decide. Open the
        documents yourself before approving — the score is assistance, not
        proof.
      </p>

      {/* Empty queue — the good kind of empty */}
      {users.length === 0 ? (
        <div className="mt-6 border border-dashed border-gray-300 rounded-xl p-10 text-center">
          <p className="font-header text-lg text-gray-900">Queue is clear</p>
          <p className="font-body text-sm text-passive mt-1">
            Nothing waiting for review. New registrations land here
            automatically.
          </p>
        </div>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {users.map((u) => (
            // min-w-0 + overflow-hidden — the responsive trio on every card
            <li
              key={u.id}
              className="border border-gray-100 rounded-xl p-4 overflow-hidden"
            >
              {/* Identity row */}
              <div className="flex items-start gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <p className="font-body font-bold text-sm md:text-base text-gray-900 line-clamp-2">
                    {u.name}
                  </p>
                  <p className="font-body text-xs text-passive truncate mt-0.5">
                    {u.email}
                  </p>
                  <p className="font-body text-xs text-passive mt-0.5">
                    Claims {u.barangay?.name || "no barangay"} · registered{" "}
                    {new Date(u.createdAt).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                {/* Pills — role, status, OCR verdict */}
                <div className="flex gap-2 flex-wrap shrink-0">
                  <RolePill role={u.role} />
                  <AccountPill status={u.accountStatus} />
                  <OcrPill result={u.ocrResult} confidence={u.ocrConfidence} />
                </div>
              </div>

              {/* OCR issues — the reason the engine hesitated.
                  Shown inline because it drives the admin's decision. */}
              {u.ocrIssues?.length > 0 && (
                <ul className="mt-3 border border-gray-100 rounded-lg p-3 flex flex-col gap-1">
                  {u.ocrIssues.map((issue, i) => (
                    <li
                      key={i}
                      className="font-body text-xs text-gray-700 wrap-break-word"
                    >
                      · {issue}
                    </li>
                  ))}
                </ul>
              )}

              {/* Document links — open in a new tab, admin eyeballs them.
                  rel noreferrer because these are Cloudinary URLs. */}
              <div className="mt-3 flex gap-2 flex-wrap">
                {u.idDocumentUrl ? (
                  <a
                    href={u.idDocumentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-outline rounded-lg px-3 py-2 font-body text-xs font-bold"
                  >
                    Open government ID
                  </a>
                ) : (
                  <span className="font-body text-xs text-danger self-center">
                    No ID uploaded
                  </span>
                )}
                {u.certDocumentUrl ? (
                  <a
                    href={u.certDocumentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-outline rounded-lg px-3 py-2 font-body text-xs font-bold"
                  >
                    Open barangay certificate
                  </a>
                ) : (
                  <span className="font-body text-xs text-danger self-center">
                    No certificate uploaded
                  </span>
                )}
              </div>

              {/* Action row — decide, inspect, or re-read the documents */}
              <div className="mt-3 flex gap-2 flex-wrap">
                <button
                  onClick={() => openApprove(u)}
                  className="btn-primary rounded-lg px-4 py-2 font-body text-xs font-bold"
                >
                  Approve
                </button>
                <button
                  onClick={() => setRejectTarget(u)}
                  className="rounded-lg px-4 py-2 font-body text-xs font-bold text-danger border border-danger/30 hover:bg-danger/10"
                >
                  Reject
                </button>
                <button
                  onClick={() => toggleAudit(u.id)}
                  className="btn-active border border-gray-200 rounded-lg px-3 py-2 font-body text-xs font-bold text-gray-900"
                >
                  {auditId === u.id ? "Hide OCR details" : "OCR details"}
                </button>
                {/* Re-run — disabled while running, spinner inside the button */}
                <button
                  onClick={() => handleRerun(u.id)}
                  disabled={rerunId === u.id}
                  className="btn-active border border-gray-200 rounded-lg px-3 py-2 font-body text-xs font-bold text-gray-900 disabled:opacity-50 flex items-center gap-2"
                >
                  {rerunId === u.id ? (
                    <>
                      <Spinner />
                      Re-reading...
                    </>
                  ) : (
                    "Re-run OCR"
                  )}
                </button>
              </div>

              {/* OCR audit drawer — the backend's human-readable summary.
                  whitespace-pre-line keeps its newlines, overflow-x-auto
                  stops long extracted lines from widening the card. */}
              {auditId === u.id && (
                <div className="mt-3 border border-gray-100 rounded-lg bg-gray-50 p-3 overflow-hidden">
                  {auditLoading ? (
                    <p className="flex items-center gap-2 font-body text-xs text-passive">
                      <Spinner />
                      Loading OCR audit trail...
                    </p>
                  ) : (
                    <pre className="font-body text-xs text-gray-700 whitespace-pre-line wrap-break-word">
                      {auditData?.ocrVerification?.summary ||
                        "No OCR data recorded for this user."}
                    </pre>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* ── APPROVE MODAL ── */}
      {/* tone primary because approving creates access, it does not destroy.
          The barangay Select rides in the children slot. */}
      <ConfirmModal
        open={!!approveTarget}
        title="Approve registration"
        message={`${approveTarget?.name || ""} gets full access once approved. Confirm the barangay their documents actually prove — this is what the Verified Local Vendor badge rests on.`}
        confirmLabel="Approve"
        tone="primary"
        size="md"
        busy={busy}
        // Blocked until a barangay is chosen — mirrors the server rule
        confirmDisabled={!approveBarangayId}
        onConfirm={handleApprove}
        onCancel={() => setApproveTarget(null)}
      >
        <label className="font-body text-xs font-bold text-gray-900 block mb-2">
          Verified barangay
        </label>
        {/* Custom Select — ids as values, never names */}
        <Select
          value={approveBarangayId}
          onChange={setApproveBarangayId}
          options={barangayOptions}
          ariaLabel="Verified barangay"
        />
        {/* Claim versus decision — flag a mismatch out loud */}
        {approveTarget?.barangay?.name && (
          <p className="font-body text-xs text-passive mt-2">
            They claimed {approveTarget.barangay.name} at registration.
          </p>
        )}
      </ConfirmModal>

      {/* ── REJECT MODAL ── */}
      {/* Default danger tone, no slot needed — status flip only */}
      <ConfirmModal
        open={!!rejectTarget}
        title="Reject registration"
        message={`${rejectTarget?.name || ""} will be marked rejected and cannot sell or buy. Their documents stay on file for the audit trail.`}
        confirmLabel="Reject"
        busy={busy}
        onConfirm={handleReject}
        onCancel={() => setRejectTarget(null)}
      />
    </div>
  );
};

export default PendingVerifications;
