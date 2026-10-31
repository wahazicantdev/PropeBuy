import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../../stores/auth.store.js";
import { fetchMe } from "../../api/auth.api.js";
import { fetchBarangays } from "../../api/product.api.js";
// House badge — shows only when the account is VERIFIED
import VerifiedBadge from "../../components/VerifiedBadge.jsx";

// SellerProfile — read-only account info, mirrors BuyerProfile.
// No edit endpoint exists on the backend yet, so the page never fakes one.
const SellerProfile = () => {
  // Store user plus the writer sync helper
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  // Barangay id → name for the display row
  const [barangayName, setBarangayName] = useState("");

  // Refresh from server truth so the status is never a stale store copy
  useEffect(() => {
    fetchMe()
      .then((res) => {
        // Sync store with fresh server data
        setUser(res.data);
        // Resolve barangay name when the seller picked one
        if (res.data?.barangayId) {
          fetchBarangays()
            .then((b) =>
              setBarangayName(
                b.data?.find((x) => x.id === res.data.barangayId)?.name || "",
              ),
            )
            .catch(() => setBarangayName(""));
        }
      })
      .catch(() => toast.error("Failed to load profile"));
  }, [setUser]);

  // Logout — hard reload pattern from the sidebar plate so protected
  // routes never race the store clear on the way back to login
  const handleLogout = () => {
    useAuthStore.getState().logout();
    toast.success("Logged out");
    window.location.href = "/login/seller";
  };

  // Member-since helper, short local format
  const since = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-PH", {
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <div className="page-enter max-w-lg">
      {/* Bold header */}
      <h1 className="font-header font-bold text-2xl text-gray-900">
        Shop profile
      </h1>
      <p className="font-body text-sm text-passive mt-1">
        Your vendor account at a glance.
      </p>
      {/* Info card */}
      <div className="mt-4 border border-black/10 rounded-xl p-5 space-y-3 font-body text-sm">
        {/* Name row */}
        <div className="flex justify-between gap-3">
          <span className="text-passive">Name</span>
          <span className="font-bold text-gray-900 text-right">
            {user?.name || "-"}
          </span>
        </div>
        {/* Email row */}
        <div className="flex justify-between gap-3">
          <span className="text-passive">Email</span>
          <span className="font-bold text-gray-900 text-right break-all">
            {user?.email || "-"}
          </span>
        </div>
        {/* Role row */}
        <div className="flex justify-between gap-3">
          <span className="text-passive">Role</span>
          <span className="font-bold text-gray-900">{user?.role || "-"}</span>
        </div>
        {/* Shop location row */}
        <div className="flex justify-between gap-3">
          <span className="text-passive">Barangay</span>
          <span className="font-bold text-gray-900 text-right">
            {barangayName || "-"}
          </span>
        </div>
        {/* Status row — words plus the VERIFIED badge when earned */}
        <div className="flex justify-between gap-3">
          <span className="text-passive">Account</span>
          <span className="flex items-center gap-1.5">
            <span
              className={`font-bold ${
                user?.accountStatus === "VERIFIED"
                  ? "text-primary"
                  : user?.accountStatus === "REJECTED"
                    ? "text-danger"
                    : "text-gray-700"
              }`}
            >
              {user?.accountStatus === "VERIFIED"
                ? "Verified"
                : user?.accountStatus === "REJECTED"
                  ? "Rejected"
                  : "Pending review"}
            </span>
            {/* Badge only renders for VERIFIED — component honestly gates */}
            {user?.accountStatus === "VERIFIED" && <VerifiedBadge />}
          </span>
        </div>
        {/* Member since row */}
        {since && (
          <div className="flex justify-between gap-3">
            <span className="text-passive">Member since</span>
            <span className="font-bold text-gray-900">{since}</span>
          </div>
        )}
      </div>
      {/* Shortcuts plus logout */}
      <div className="mt-4 grid gap-3">
        <Link
          to="/seller/products"
          className="btn-active border border-gray-200 text-center font-body py-3 rounded-lg text-gray-900"
        >
          My Products
        </Link>
        <Link
          to="/seller/orders"
          className="btn-active border border-gray-200 text-center font-body py-3 rounded-lg text-gray-900"
        >
          Orders Received
        </Link>
        <button
          onClick={handleLogout}
          className="btn-active border border-danger text-danger font-body py-3 rounded-lg"
        >
          Log Out
        </button>
      </div>
    </div>
  );
};

export default SellerProfile;