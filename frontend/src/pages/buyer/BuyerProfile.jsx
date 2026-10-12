import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../../stores/auth.store.js";
import { fetchMe } from "../../api/auth.api.js";
import { fetchBarangays } from "../../api/product.api.js";

// Buyer profile - read-only info, no edit endpoint exists on backend
const BuyerProfile = () => {
  // Store user plus writers
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  // Fresh copy plus barangay name map
  const [barangayName, setBarangayName] = useState("");
  const navigate = useNavigate();

  // Refresh from backend once so status is never stale
  useEffect(() => {
    fetchMe()
      .then((res) => {
        // Sync store with server truth
        setUser(res.data);
        // Map barangay id to name for display
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

  // Logout clears session and lands on landing
  const handleLogout = () => {
    logout();
    toast.success("Logged out");
    navigate("/");
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
        My profile
      </h1>
      <p className="font-body text-sm text-passive mt-1">
        Your account at a glance.
      </p>
      {/* Info card */}
      <div className="mt-4 border border-gray-100 rounded-xl p-5 space-y-3 font-body text-sm">
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
        {/* Barangay row */}
        <div className="flex justify-between gap-3">
          <span className="text-passive">Barangay</span>
          <span className="font-bold text-gray-900 text-right">
            {barangayName || "-"}
          </span>
        </div>
        {/* Status row with plain words */}
        <div className="flex justify-between gap-3">
          <span className="text-passive">Account</span>
          <span
            className={`font-bold ${user?.accountStatus === "VERIFIED" ? "text-primary" : user?.accountStatus === "REJECTED" ? "text-danger" : "text-gray-700"}`}
          >
            {user?.accountStatus === "VERIFIED"
              ? "Verified"
              : user?.accountStatus === "REJECTED"
                ? "Rejected"
                : "Pending review"}
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
          to="/orders"
          className="btn-active border border-gray-200 text-center font-body py-3 rounded-lg text-gray-900"
        >
          My Orders
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

export default BuyerProfile;
