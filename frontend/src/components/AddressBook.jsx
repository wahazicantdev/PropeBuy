import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import FieldLabel from "./FieldLabel.jsx";
import Icon from "./Icon.jsx";
import Spinner from "./Spinner.jsx";
import ConfirmModal from "./ConfirmModal.jsx";
import { useAuthStore } from "../stores/auth.store.js";
import {
  fetchAddresses,
  createAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
} from "../api/address.api.js";

// Most addresses a buyer can keep — matches the backend limit
const MAX = 5;

// Buyer address book — up to 5 saved addresses, one default (E2E #423).
// The default is used first at checkout, and the buyer can pick another.
const AddressBook = () => {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  // Saved list, null while loading
  const [list, setList] = useState(null);
  // Form: null closed, "new" adding, or the id being edited
  const [form, setForm] = useState(null);
  const [label, setLabel] = useState("");
  const [text, setText] = useState("");
  const [makeDefault, setMakeDefault] = useState(false);
  const [busy, setBusy] = useState(false);
  // Address waiting for the delete confirmation
  const [toDelete, setToDelete] = useState(null);

  // Every reply carries the list and the default, so both stay in sync
  const apply = (res) => {
    setList(res.data.addresses);
    setUser({ ...useAuthStore.getState().user, address: res.data.address });
  };

  // First load
  useEffect(() => {
    fetchAddresses()
      .then(apply)
      .catch(() => toast.error("Could not load your addresses"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Open the form empty for a new address, or filled for an edit
  const openForm = (a = null) => {
    setForm(a ? a.id : "new");
    setLabel(a ? a.label : list?.length ? "" : "Home");
    setText(a ? a.address : "");
    setMakeDefault(false);
  };

  // Run one API call with a busy flag and the toast
  const run = async (call) => {
    setBusy(true);
    try {
      const res = await call();
      apply(res);
      toast.success(res.message);
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save your address");
      return false;
    } finally {
      setBusy(false);
    }
  };

  // Save the form — create or update
  const save = async (e) => {
    e.preventDefault();
    const ok = await run(() =>
      form === "new" ? createAddress(label, text, makeDefault) : updateAddress(form, label, text),
    );
    if (ok) setForm(null);
  };

  return (
    <section className="border border-black/10 rounded-xl p-5 md:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="heading-body text-lg text-black flex items-center gap-2">
          <Icon name="location_on" />
          Delivery addresses
        </h2>
        {list && list.length < MAX && form === null && (
          <button onClick={() => openForm()} className="font-body text-sm font-bold underline flex items-center gap-1 shrink-0">
            <Icon name="add" size={18} /> Add
          </button>
        )}
      </div>

      {/* Saved list */}
      {list === null ? (
        <div className="h-24 rounded-xl bg-surface animate-pulse" />
      ) : list.length === 0 && form === null ? (
        <p className="font-body text-sm text-black/60">No address yet. Add one to use delivery at checkout.</p>
      ) : (
        <ul className="space-y-3">
          {list.map((a) => (
            <li key={a.id} className={`rounded-xl p-4 border ${a.isDefault ? "border-black" : "border-black/10"}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-body text-sm font-bold">{a.label}</span>
                {a.isDefault && <span className="font-body text-xs font-bold rounded-full px-2 py-0.5 bg-primary text-white">Default</span>}
              </div>
              <p className="mt-1 font-body text-sm text-black/70 wrap-break-word">{a.address}</p>
              {/* Row actions */}
              <div className="mt-2 flex gap-4 flex-wrap font-body text-xs font-bold">
                {!a.isDefault && (
                  <button disabled={busy} onClick={() => run(() => setDefaultAddress(a.id))} className="underline disabled:opacity-50">
                    Make default
                  </button>
                )}
                <button disabled={busy} onClick={() => openForm(a)} className="underline disabled:opacity-50">
                  Edit
                </button>
                <button disabled={busy} onClick={() => setToDelete(a)} className="underline text-danger disabled:opacity-50">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {list && list.length >= MAX && form === null && (
        <p className="font-body text-xs text-black/60">You can save up to {MAX} addresses.</p>
      )}

      {/* Add or edit form */}
      {form !== null && (
        <form onSubmit={save} className="rounded-xl bg-surface p-4 space-y-3">
          <div>
            <FieldLabel htmlFor="addr-label">Label</FieldLabel>
            <input id="addr-label" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={40} placeholder="Home, Work, Lola's house" className="w-full px-5 py-3 font-body text-sm bg-white" />
          </div>
          <div>
            <FieldLabel htmlFor="addr-text">Address</FieldLabel>
            <textarea id="addr-text" value={text} onChange={(e) => setText(e.target.value)} maxLength={300} rows={3} placeholder="House no., street, barangay, Muntinlupa City" className="w-full px-5 py-3 font-body text-sm rounded-xl bg-white" />
          </div>
          {form === "new" && list?.length > 0 && (
            <label className="flex items-center gap-3 font-body text-sm cursor-pointer">
              <input type="checkbox" checked={makeDefault} onChange={(e) => setMakeDefault(e.target.checked)} className="w-4 h-4 accent-black" />
              Use as my default address
            </label>
          )}
          <div className="flex gap-3">
            <button disabled={busy || !text.trim()} className="btn-primary btn-active flex-1 py-3 font-body font-medium flex items-center justify-center gap-2 disabled:opacity-50">
              {busy && <Spinner />} Save address
            </button>
            <button type="button" onClick={() => setForm(null)} disabled={busy} className="btn-outline btn-active px-6 py-3 font-body font-medium">
              Cancel
            </button>
          </div>
        </form>
      )}

      <p className="font-body text-xs text-black/60">
        {user?.address ? "Your default address is picked first at checkout. You can choose another there." : "Used when you choose delivery at checkout."}
      </p>

      {/* Delete confirmation — house modal */}
      <ConfirmModal
        open={!!toDelete}
        title="Delete this address?"
        message={toDelete ? `"${toDelete.label}" will be removed.${toDelete.isDefault ? " Your next saved address becomes the default." : ""}` : ""}
        confirmLabel="Delete"
        cancelLabel="Keep it"
        busy={busy}
        onConfirm={async () => {
          await run(() => deleteAddress(toDelete.id));
          setToDelete(null);
        }}
        onCancel={() => setToDelete(null)}
      />
    </section>
  );
};

export default AddressBook;
