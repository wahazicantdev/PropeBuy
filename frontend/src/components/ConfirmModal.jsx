// Reusable confirm dialog — guard for destructive actions
// Built for MyProducts delete, reused by admin moderation in Phase E
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

  return (
    // Overlay covers everything, tap outside cancels
    <div
      className="fixed inset-0 z-100 bg-black/40 flex items-center justify-center p-4"
      onClick={onCancel}
      role="presentation"
    >
      {/* Card — stopPropagation so taps inside never close it */}
      <div
        className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h3 className="font-header font-bold text-lg text-gray-900 mb-2">
          {title}
        </h3>
        <p className="font-body text-sm text-gray-600 mb-6 wrap-break-words">
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
    </div>
  );
};

export default ConfirmModal;