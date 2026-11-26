import { lazy, Suspense, useState } from "react";
import toast from "react-hot-toast";
import FieldLabel from "./FieldLabel.jsx";
import Icon from "./Icon.jsx";
import { updateProfile } from "../api/auth.api.js";
import { useAuthStore } from "../stores/auth.store.js";

// Map code loads only when a seller opens their profile
const StoreMap = lazy(() => import("./StoreMap.jsx"));

// Saved address card. Buyers use it for delivery, sellers as the store
// address. The parent remounts it with a key when the saved user changes.
const ProfileAddress = ({ isSeller = false }) => {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  // Form values start from the saved profile
  const [address, setAddress] = useState(user?.address || "");
  // Seller delivery settings
  const [offersDelivery, setOffersDelivery] = useState(!!user?.offersDelivery);
  // Store pin, null until the seller taps the map
  const [pin, setPin] = useState(
    user?.storeLat != null ? { lat: user.storeLat, lng: user.storeLng } : null,
  );
  const [saving, setSaving] = useState(false);

  // Save, then sync the store so checkout sees the new address at once
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateProfile(
        isSeller
          ? {
              address,
              offersDelivery,
              storeLat: pin ? pin.lat : null,
              storeLng: pin ? pin.lng : null,
            }
          : { address },
      );
      setUser({ ...user, ...res.data });
      toast.success(res.message);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save your address");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="border border-black/10 rounded-xl p-5 md:p-6 space-y-4">
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
      {/* Store pin — tap the map, saved with the button below */}
      {isSeller && (
        <div>
          <FieldLabel>Store location pin</FieldLabel>
          <Suspense
            fallback={<div className="h-[260px] rounded-xl bg-surface flex items-center justify-center font-body text-sm text-black/60">Loading map...</div>}
          >
            <StoreMap
              lat={pin?.lat}
              lng={pin?.lng}
              onPick={(lat, lng) => setPin({ lat, lng })}
            />
          </Suspense>
          <div className="mt-1 pl-1 flex items-center justify-between gap-3 font-body text-xs text-black/60">
            <span>{pin ? "Pin placed. Tap again to move it." : "Tap the map where your store is, inside the dashed Muntinlupa border."}</span>
            {pin && (
              <button type="button" onClick={() => setPin(null)} className="font-bold underline text-black shrink-0">
                Remove pin
              </button>
            )}
          </div>
        </div>
      )}
      {/* Seller delivery switch. The fee is set on each product from its
          weight (11-26), so there is no flat store fee any more. */}
      {isSeller && (
        <div className="space-y-3">
          <label className="flex items-center gap-3 font-body text-sm text-black cursor-pointer">
            <input
              type="checkbox"
              checked={offersDelivery}
              onChange={(e) => setOffersDelivery(e.target.checked)}
              className="w-4 h-4 accent-black"
            />
            I deliver orders
          </label>
          {offersDelivery && (
            <p className="font-body text-xs text-black/60 pl-1">
              You set the delivery fee on each product, based on its weight. Buyers pay it online
              before you deliver. Edit a product to change its fee.
            </p>
          )}
        </div>
      )}
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
