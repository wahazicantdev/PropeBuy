import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../../stores/auth.store.js";
import { fetchMe } from "../../api/auth.api.js";
import { fetchBarangays } from "../../api/product.api.js";
import Icon from "../../components/Icon.jsx";

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

  // Rows — icon, label, value; one list keeps the markup flat
  const rows = [
    { icon: "mail", label: "Email", value: user?.email || "-" },
    { icon: "badge", label: "Role", value: user?.role === "BUYER" ? "Buyer" : user?.role || "-" },
    { icon: "location_on", label: "Barangay", value: barangayName || "-" },
    ...(since ? [{ icon: "schedule", label: "Member since", value: since }] : []),
  ];
  const verified = user?.accountStatus === "VERIFIED";

  return (
    <div className="page-enter max-w-2xl">
      {/* Breadcrumb */}
      <nav className="font-body text-sm text-black/60 flex items-center gap-1" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-black">Home</Link>
        <Icon name="chevron_right" size={16} />
        <span className="text-black">My profile</span>
      </nav>

      {/* ── IDENTITY CARD — gray header block ── */}
      <section className="mt-5 bg-card rounded-xl p-6 md:p-8 flex items-center gap-5">
        <span className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary text-white flex items-center justify-center font-header text-2xl md:text-3xl shrink-0">
          {(user?.name || "?").charAt(0)}
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl text-black break-words">{user?.name || "-"}</h1>
          {/* Status in plain words, green mark only when verified */}
          <p className={`mt-2 font-body text-sm font-medium flex items-center gap-1.5 ${verified ? "text-black" : user?.accountStatus === "REJECTED" ? "text-danger" : "text-black/60"}`}>
            <Icon
              name={verified ? "verified" : user?.accountStatus === "REJECTED" ? "block" : "pending"}
              size={18}
              className={verified ? "text-success" : ""}
            />
            {verified ? "Verified member" : user?.accountStatus === "REJECTED" ? "Not verified" : "Documents under review"}
          </p>
        </div>
      </section>

      {/* ── DETAILS — divided rows ── */}
      <ul className="mt-4 border border-black/10 rounded-xl px-5 md:px-6 divide-y divide-black/10">
        {rows.map((r) => (
          <li key={r.label} className="py-4 flex items-center gap-4 font-body text-sm md:text-base min-w-0">
            <span className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0">
              <Icon name={r.icon} size={20} />
            </span>
            <span className="text-black/60 shrink-0">{r.label}</span>
            <span className="ml-auto font-bold text-black text-right break-all">{r.value}</span>
          </li>
        ))}
      </ul>

      {/* Shortcuts plus logout */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Link to="/orders" className="btn-primary btn-active py-3.5 text-center font-body font-medium flex items-center justify-center gap-2">
          <Icon name="receipt_long" />
          My orders
        </Link>
        <button
          onClick={handleLogout}
          className="btn-active rounded-full border border-danger/40 text-danger py-3.5 font-body font-medium flex items-center justify-center gap-2 hover:bg-danger/5"
        >
          <Icon name="logout" />
          Log out
        </button>
      </div>
      {/* Honest scope note — editing waits for a backend endpoint */}
      <p className="mt-4 font-body text-xs text-black/40">
        Profile details come from your verified documents. Contact your
        barangay administrator to change them.
      </p>
    </div>
  );
};

export default BuyerProfile;
