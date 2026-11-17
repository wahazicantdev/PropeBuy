import { useState } from "react";
import toast from "react-hot-toast";
import FieldLabel from "./FieldLabel.jsx";
import Icon from "./Icon.jsx";
import Spinner from "./Spinner.jsx";
import { saveRefundGcash } from "../api/order.api.js";

// Buyer tells PropeBuy where to send the refund of a cancelled paid order.
// Shown only while a refund is still waiting, so the number is asked for
// only when it is needed and is cleared once the refund is sent (RA 10173).
// order   — the order with its earnings (refund rows)
// onSaved — called with the masked number after a save
const RefundGcashForm = ({ order, onSaved }) => {
  // Refund rows still waiting; nothing to ask once all are sent
  const waiting = (order.earnings || []).filter((e) => e.status === "REFUND_DUE");
  // Masked number already given, e.g. 09•••••4567
  const saved = waiting.find((e) => e.refundGcash)?.refundGcash || null;
  // Form open by default only when no number was given yet
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [busy, setBusy] = useState(false);

  if (!waiting.length) return null;

  // Save the name and number, then show the masked copy
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await saveRefundGcash(order.id, name, number);
      toast.success(res.message);
      setEditing(false);
      setName("");
      setNumber("");
      onSaved(res.data.refundGcash);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save your GCash number");
    } finally {
      setBusy(false);
    }
  };

  // Number given and not being changed: show where the money goes
  if (saved && !editing) {
    return (
      <div className="mt-3 rounded-xl border border-black/10 p-4 font-body text-sm flex items-center gap-3 flex-wrap">
        <Icon name="account_balance_wallet" />
        <span className="flex-1 min-w-0">
          Your refund goes to GCash <span className="font-bold tabular-nums">{saved}</span>.
        </span>
        <button onClick={() => setEditing(true)} className="text-xs font-bold underline">
          Change
        </button>
      </div>
    );
  }

  // Ask for the GCash account
  return (
    <form onSubmit={save} className="mt-3 rounded-xl border border-black/10 p-4 space-y-3">
      <div>
        <p className="font-body text-sm font-bold">Where should we send your refund?</p>
        <p className="font-body text-xs text-passive mt-1">
          Only the PropeBuy admin sees this, and it is deleted once your refund is sent.
        </p>
      </div>
      <div>
        <FieldLabel htmlFor="refund-name">Name on the GCash account</FieldLabel>
        <input id="refund-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="Juan Dela Cruz" className="w-full px-5 py-3 font-body text-sm" />
      </div>
      <div>
        <FieldLabel htmlFor="refund-number">GCash number</FieldLabel>
        <input id="refund-number" value={number} onChange={(e) => setNumber(e.target.value)} inputMode="numeric" maxLength={16} placeholder="09XX XXX XXXX" className="w-full px-5 py-3 font-body text-sm" />
      </div>
      <div className="flex gap-3">
        <button disabled={busy || name.trim().length < 2 || !number.trim()} className="btn-primary btn-active flex-1 py-3 font-body font-medium flex items-center justify-center gap-2 disabled:opacity-50">
          {busy && <Spinner />} Save GCash
        </button>
        {saved && (
          <button type="button" onClick={() => setEditing(false)} disabled={busy} className="btn-outline btn-active px-6 py-3 font-body font-medium">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default RefundGcashForm;
