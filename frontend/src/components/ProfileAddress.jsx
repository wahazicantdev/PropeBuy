import { useState } from "react";
import toast from "react-hot-toast";
import FieldLabel from "./FieldLabel.jsx";
import Icon from "./Icon.jsx";
import { updateProfile } from "../api/auth.api.js";
import { useAuthStore } from "../stores/auth.store.js";

// Saved address card. Buyers use it for delivery, sellers as the store
// address. The parent remounts it with a key when the saved user changes.
const ProfileAddress = ({ isSeller = false }) => {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  // Form values start from the saved profile
  const [address, setAddress] = useState(user?.address || "");
  const [saving, setSaving] = useState(false);

  // Save, then sync the store so checkout sees the new address at once
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateProfile({ address });
      setUser({ ...user, ...res.data });
      toast.success(res.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save your address");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="mt-4 border border-black/10 rounded-xl p-5 md:p-6 space-y-4">
      <h2 className="heading-body text-lg text-black flex items-center gap-2">
        <Icon name="location_on" />
        {isSeller ? "Store address" : "Delivery address"}
      </h2>
      {/* Address — free text, house number to barangay */}
      <div>
        <FieldLabel htmlFor="address">Address</FieldLabel>
        <textarea
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          maxLength={300}
          rows={3}
          placeholder="House no., street, barangay, Muntinlupa City"
          className="w-full px-5 py-3.5 font-body text-sm rounded-xl bg-surface"
        />
        <p className="font-body text-xs text-black/60 mt-1 pl-1">
          {isSeller
            ? "Shown to buyers who pick up from your store."
            : "Used when you choose delivery at checkout."}
        </p>
      </div>
      <button
        disabled={saving}
        className="btn-primary btn-active w-full py-3 font-body font-medium flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {saving ? <span className="spinner" /> : <Icon name="check_circle" />}
        {saving ? "Saving..." : "Save"}
      </button>
    </form>
  );
};

export default ProfileAddress;
