import { useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import FieldLabel from "./FieldLabel.jsx";
import Icon from "./Icon.jsx";
import Spinner from "./Spinner.jsx";
import { useAuthStore } from "../stores/auth.store.js";
import { updateStoreName } from "../api/auth.api.js";

// Asks a newly verified seller for their store name (Yoy, 11-17).
// Buyers see this name on every listing instead of the real name, so a
// seller cannot list products until it is set. "Later" hides it for this
// visit only. House modal look: portal, dim + blur, pop-in card.
const StoreNamePrompt = () => {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  // Dismissed for this visit
  const [later, setLater] = useState(() => {
    try {
      return sessionStorage.getItem("propebuy_store_name_later") === "1";
    } catch {
      return false;
    }
  });

  // Only verified sellers without a store name
  const open = user?.role === "SELLER" && user?.accountStatus === "VERIFIED" && !user?.storeName && !later;
  if (!open) return null;

  // Save, then the prompt closes because storeName is set
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await updateStoreName(value);
      setUser({ ...useAuthStore.getState().user, ...res.data });
      toast.success("Store name saved. Buyers will see it on your products.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save the store name");
    } finally {
      setBusy(false);
    }
  };

  // Hide until the next visit
  const skip = () => {
    try {
      sessionStorage.setItem("propebuy_store_name_later", "1");
    } catch {
      // Private window — it just shows again next page load
    }
    setLater(true);
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 fade-enter">
      <form onSubmit={save} className="pop-enter w-full max-w-md bg-white rounded-xl p-6 space-y-4" role="dialog" aria-modal="true" aria-labelledby="store-name-title">
        <span className="w-12 h-12 rounded-full bg-surface flex items-center justify-center">
          <Icon name="storefront" size={24} />
        </span>
        <h2 id="store-name-title" className="heading-body text-xl">
          You are verified. Name your store
        </h2>
        <p className="font-body text-sm text-black/60">
          Buyers see your store name on every product. Your real name stays private, only you and
          PropeBuy staff can see it.
        </p>
        <div>
          <FieldLabel htmlFor="store-name">Store name</FieldLabel>
          <input
            id="store-name"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            maxLength={60}
            autoFocus
            placeholder="Example: Aling Nena's Kakanin"
            className="w-full px-5 py-3.5 font-body text-sm"
          />
          <p className="mt-1 pl-1 font-body text-xs text-black/60">3 to 60 characters. You can change it once every 7 days.</p>
        </div>
        <div className="flex gap-3">
          <button
            disabled={busy || value.trim().length < 3}
            className="btn-primary btn-active flex-1 py-3 font-body font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {busy && <Spinner />} Save store name
          </button>
          <button type="button" onClick={skip} disabled={busy} className="btn-outline btn-active px-6 py-3 font-body font-medium">
            Later
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
};

export default StoreNamePrompt;
