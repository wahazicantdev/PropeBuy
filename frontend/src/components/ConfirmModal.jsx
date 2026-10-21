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
  onConfirm,
  onCancel,
}) => {
  // Render nothing when closed — parent owns the state
  if (!open) return null;

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
        className="pop-enter bg-white rounded-lg shadow-lg max-w-sm w-full p-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h3 className="font-header font-bold text-lg text-gray-900 mb-2">
          {title}
        </h3>
        <p className="font-body text-sm text-gray-600 mb-6 wrap-break-word">
          {message}
        </p>
        <div className="flex gap-3">
          {/* Confirm — soft red danger token, disabled while busy */}
          <button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 bg-danger text-white font-body text-sm font-bold rounded-lg py-2.5 hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Working..." : confirmLabel}
          </button>
          {/* Cancel — passive gray, same busy rule */}
          <button
            onClick={onCancel}
            disabled={busy}
            className="flex-1 bg-gray-100 text-gray-700 font-body text-sm font-bold rounded-lg py-2.5 hover:bg-gray-200 disabled:opacity-50"
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