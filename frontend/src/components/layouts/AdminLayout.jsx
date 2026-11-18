import { useEffect, useState } from "react";
import BackofficeLayout from "./BackofficeLayout.jsx";
// Auth store — same source every other shell reads, always live state
import { useAuthStore } from "../../stores/auth.store.js";
import { fetchMe } from "../../api/auth.api.js";
import Icon from "../Icon.jsx";
import Spinner from "../Spinner.jsx";
import { adminCan, adminHome, LEVEL_LABEL } from "../../utils/adminAccess.js";

// Admin links, grouped by job. Each names the area it belongs to, and a
// staff member sees only the areas their level may use (Yoy, 11-18).
const GROUPS = [
  {
    title: "Overview",
    links: [
      { to: "/admin/dashboard", label: "Dashboard", icon: "dashboard", area: "dashboard" },
      { to: "/admin/insights", label: "Barangay Insights", icon: "bar_chart", area: "insights" },
    ],
  },
  {
    title: "People",
    links: [
      { to: "/admin/pending", label: "Verifications", icon: "how_to_reg", area: "verifications" },
      { to: "/admin/users", label: "Users", icon: "group", area: "users" },
    ],
  },
  {
    title: "Marketplace",
    links: [
      { to: "/admin/products", label: "Products", icon: "inventory_2", area: "products" },
      { to: "/admin/orders", label: "Orders", icon: "receipt_long", area: "orders" },
      { to: "/admin/payouts", label: "Payouts", icon: "payments", area: "payouts" },
    ],
  },
  {
    title: "Settings",
    links: [
      { to: "/admin/barangays", label: "Barangays", icon: "location_on", area: "settings" },
      { to: "/admin/categories", label: "Categories", icon: "category", area: "settings" },
      { to: "/admin/staff", label: "Staff", icon: "badge", area: "staff" },
      { to: "/admin/activity", label: "Activity log", icon: "flag", area: "activity" },
    ],
  },
];

// Admin shell — same back-office frame as the seller center
const AdminLayout = () => {
  const { user, logout } = useAuthStore();
  // Barangay a verifier works for, from /auth/me
  const [barangayName, setBarangayName] = useState(null);

  // Refresh the staff level and barangay once. Sessions saved before the
  // roles update have no adminLevel yet, and the menu waits for it.
  useEffect(() => {
    fetchMe()
      .then((res) => {
        const { user: current, setUser } = useAuthStore.getState();
        if (res.data) setUser({ ...current, adminLevel: res.data.adminLevel, barangayId: res.data.barangay?.id ?? null });
        setBarangayName(res.data?.barangay?.name || null);
      })
      // The axios 401 handler already ends a dead session
      .catch(() => {});
  }, []);

  // Hard reload: admins share the buyer login door, and a navigate()
  // would trip the admin guard mid-render
  const handleLogout = () => {
    logout();
    window.location.href = "/login/buyer";
  };

  // Level not known yet (older saved session): wait for /auth/me
  if (!user?.adminLevel) {
    return (
      <div className="min-h-screen flex items-center justify-center gap-3 font-body text-sm text-passive">
        <Spinner /> Loading your staff account...
      </div>
    );
  }

  // Only the links this level may open, and no empty group titles
  const groups = GROUPS.map((g) => ({ ...g, links: g.links.filter((l) => adminCan(user, l.area)) })).filter(
    (g) => g.links.length > 0,
  );
  const verifier = user.adminLevel === "BARANGAY_VERIFIER";

  return (
    <BackofficeLayout
      groups={groups}
      homePath={adminHome(user)}
      area={verifier ? `Barangay ${barangayName || "verifier"}` : "PropeBuy admin"}
      onLogout={handleLogout}
      account={
        <>
          <p className="font-body text-sm font-bold text-black truncate flex items-center gap-1.5">
            <Icon name="admin_panel_settings" size={18} />
            {user?.name || "Administrator"}
          </p>
          {/* Staff level, plus the barangay for a verifier */}
          <p className="font-body text-xs text-black/60 truncate">
            {LEVEL_LABEL[user.adminLevel]}
            {verifier && barangayName ? ` · ${barangayName}` : ""}
          </p>
          <p className="font-body text-xs text-black/60 truncate">{user?.email}</p>
        </>
      }
    />
  );
};

export default AdminLayout;
