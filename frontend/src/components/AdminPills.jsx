// Admin-only pills — same shape and color language as OrderStatus.jsx
// so one glance reads the same way across every portal in PropeBuy.
// Primary = good, gray = waiting, soft red = bad.

// ── ACCOUNT STATUS ──
// Mirrors the AccountStatus enum: PENDING / VERIFIED / REJECTED
const ACCOUNT_STYLES = {
  PENDING: "bg-gray-100 text-gray-700", // waiting on an admin decision
  VERIFIED: "bg-primary text-white", // approved, full access
  REJECTED: "bg-danger/10 text-danger", // rejected or suspended
};
const ACCOUNT_LABELS = {
  PENDING: "Pending",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
};

export const AccountPill = ({ status }) => {
  return (
    <span
      className={`font-body text-xs font-bold rounded-full px-3 py-1 ${ACCOUNT_STYLES[status] || ACCOUNT_STYLES.PENDING}`}
    >
      {ACCOUNT_LABELS[status] || status}
    </span>
  );
};

// ── ROLE ──
// Flat gray for everyone — role is information, not a judgement
export const RolePill = ({ role }) => {
  return (
    <span className="font-body text-xs font-bold rounded-full px-3 py-1 bg-gray-100 text-gray-700">
      {role === "BUYER" ? "Buyer" : role === "SELLER" ? "Seller" : "Admin"}
    </span>
  );
};

// ── OCR RESULT ──
// What the OCR engine decided before any human looked:
// AUTO_APPROVED >=60, MANUAL_REVIEW 30-59, AUTO_REJECTED <30
const OCR_STYLES = {
  AUTO_APPROVED: "bg-primary/10 text-primary", // OCR says clean
  MANUAL_REVIEW: "bg-gray-100 text-gray-700", // OCR unsure, human needed
  AUTO_REJECTED: "bg-danger/10 text-danger", // OCR says mismatch
};
const OCR_LABELS = {
  AUTO_APPROVED: "OCR: clean",
  MANUAL_REVIEW: "OCR: needs review",
  AUTO_REJECTED: "OCR: mismatch",
};

export const OcrPill = ({ result, confidence }) => {
  // No OCR data — older accounts registered before OCR existed.
  // Say so out loud instead of pretending the check passed.
  if (!result) {
    return (
      <span className="font-body text-xs font-bold rounded-full px-3 py-1 bg-gray-100 text-gray-500">
        No OCR data
      </span>
    );
  }
  return (
    <span
      className={`font-body text-xs font-bold rounded-full px-3 py-1 ${OCR_STYLES[result] || OCR_STYLES.MANUAL_REVIEW}`}
    >
      {OCR_LABELS[result] || result}
      {/* Confidence rides inside the pill when the backend sent one */}
      {confidence !== null && confidence !== undefined
        ? ` · ${confidence}%`
        : ""}
    </span>
  );
};
