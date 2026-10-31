import { createPortal } from "react-dom";

// Reusable confirm dialog — guard for destructive actions
// House standard for ALL modals: portal to body, dim + blur backdrop,
// fade-in overlay, smooth pop-in card (built for MyProducts delete,
// reused by admin moderation in Phase E)
const ConfirmModal = ({
  // open — parent controls visibility, no internal show/hide state
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  // busy — disables both buttons while the action runs
  busy = false,
  // tone — Phase E addition. "danger" (default) keeps every existing
  // caller red; "primary" is for confirms that CREATE instead of destroy,
  // like approving a vendor. Red on an approve button lies about intent.
  tone = "danger",
  // children — Phase E addition. Optional slot between message and
  // buttons for extra fields (a removal reason textarea, an OCR summary).
  // Omit it and the modal looks exactly like it always did.
  children,
  // confirmDisabled — lets a caller block confirm until its slot is
  // filled in, e.g. product removal needs a reason before submitting
  confirmDisabled = false,
  // size — "sm" (default) for plain confirms, "md" when a slot needs room
  size = "sm",
  onConfirm,
  onCancel,
}) => {
  // Render nothing when closed — parent owns the state
  if (!open) return null;

  // Confirm button skin — one lookup, no nested ternaries in the JSX
  const confirmSkin =
    tone === "primary" ? "btn-primary" : "bg-danger text-white";
  // Card width — grows only when the caller asks for a slot
  const cardWidth = size === "md" ? "max-w-md" : "max-w-sm";

  // createPortal renders to document.body — the overlay escapes every
  // ancestor, so it ALWAYS covers the whole screen, sidebar included
  return createPortal(
    // Overlay — fade-in, dim plus blur, tap outside cancels
    <div
      className="fade-enter fixed inset-0 z-100 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
      role="presentation"
    >
      {/* Card — pop-enter, stopPropagation so taps inside never close it */}
      <div
        className={`pop-enter bg-white rounded-xl shadow-lg ${cardWidth} w-full p-6 md:p-7 overflow-hidden max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h3 className="font-header font-bold text-lg text-gray-900 mb-2">
          {title}
        </h3>
        <p className="font-body text-sm text-gray-600 wrap-break-word">
          {message}
        </p>
        {/* Slot — only takes vertical space when a caller passes children */}
        {children ? <div className="mt-4">{children}</div> : null}
        <div className="flex gap-3 mt-6">
          {/* Confirm — tone picks the skin, disabled while busy or blocked */}
          <button
            onClick={onConfirm}
            disabled={busy || confirmDisabled}
            className={`flex-1 ${confirmSkin} font-body text-sm font-bold rounded-full py-3 hover:opacity-90 disabled:opacity-50`}
          >
            {busy ? "Working..." : confirmLabel}
          </button>
          {/* Cancel — passive gray, busy only (never blocked by the slot) */}
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 bg-surface text-black font-body text-sm font-bold rounded-full py-3 hover:bg-black/10 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>,
    // Portal target — body, outside the whole React app tree
    document.body,
  );
};

export default ConfirmModal;
