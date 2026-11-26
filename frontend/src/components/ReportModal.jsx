import { useState } from "react";
import toast from "react-hot-toast";
import ConfirmModal from "./ConfirmModal.jsx";
import { sendReport } from "../api/report.api.js";
import { REPORT_REASONS } from "../utils/reports.js";

// Report dialog (11-26) — a buyer flags a product (productId) or the
// store behind an order (orderId). Built on the house ConfirmModal.
const ReportModal = ({ open, onClose, productId = null, orderId = null, title }) => {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);

  // Weight and fee reasons only make sense for one listing
  const reasons = REPORT_REASONS.filter((r) => productId || !r.product);
  // "Something else" needs a short story so staff know what to check
  const needsDetails = reason === "OTHER" && details.trim().length < 10;

  // Close and clear the form
  const close = () => {
    setReason("");
    setDetails("");
    onClose();
  };

  // Send the report, then close on success
  const submit = async () => {
    setBusy(true);
    try {
      const res = await sendReport({ productId, orderId, reason, details: details.trim() });
      toast.success(res.message || "Report sent");
      close();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send the report");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConfirmModal
      open={open}
      title={title || "Report a problem"}
      message="PropeBuy staff review every report. False reports can lead to action on your own account."
      confirmLabel="Send report"
      busy={busy}
      size="md"
      confirmDisabled={!reason || needsDetails}
      onConfirm={submit}
      onCancel={close}
    >
      {/* Reason list — one radio per reason */}
      <fieldset className="space-y-2">
        <legend className="font-body text-xs text-black/60 mb-2">What is wrong?</legend>
        {reasons.map((r) => (
          <label key={r.key} className="flex items-start gap-3 font-body text-sm cursor-pointer">
            <input
              type="radio"
              name="report-reason"
              value={r.key}
              checked={reason === r.key}
              onChange={() => setReason(r.key)}
              className="mt-0.5 w-4 h-4 shrink-0 accent-black"
            />
            {r.label}
          </label>
        ))}
      </fieldset>
      {/* Details — optional, required for "Something else" */}
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder={reason === "OTHER" ? "Tell us what happened (required)" : "Details (optional)"}
        aria-label="Report details"
        className="mt-4 w-full px-5 py-3 font-body text-sm rounded-xl resize-y"
      />
      <p className="font-body text-xs text-black/50 text-right mt-1">{details.length}/500</p>
    </ConfirmModal>
  );
};

export default ReportModal;
