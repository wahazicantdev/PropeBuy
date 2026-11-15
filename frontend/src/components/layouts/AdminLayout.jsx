import BackofficeLayout from "./BackofficeLayout.jsx";
// Auth store — same source every other shell reads, always live state
import { useAuthStore } from "../../stores/auth.store.js";
import Icon from "../Icon.jsx";

// Admin links, grouped by job: people, marketplace, money, settings
const GROUPS = [
  { title: "Overview", links: [{ to: "/admin/dashboard", label: "Dashboard", icon: "dashboard" }] },
  {
    title: "People",
    links: [
      { to: "/admin/pending", label: "Verifications", icon: "how_to_reg" },
      { to: "/admin/users", label: "Users", icon: "group" },
    ],
  },
  {
    title: "Marketplace",
    links: [
      { to: "/admin/products", label: "Products", icon: "inventory_2" },
      { to: "/admin/orders", label: "Orders", icon: "receipt_long" },
      { to: "/admin/payouts", label: "Payouts", icon: "payments" },
    ],
  },
  {
    title: "Settings",
    links: [
      { to: "/admin/barangays", label: "Barangays", icon: "location_on" },
      { to: "/admin/categories", label: "Categories", icon: "category" },
    ],
  },
];

// Admin shell — same back-office frame as the seller center
const AdminLayout = () => {
  const { user, logout } = useAuthStore();

  // Hard reload: admins share the buyer login door, and a navigate()
  // would trip the admin guard mid-render
  const handleLogout = () => {
    logout();
    window.location.href = "/login/buyer";
  };

  return (
    <BackofficeLayout
      groups={GROUPS}
      homePath="/admin/dashboard"
      area="Barangay admin"
      onLogout={handleLogout}
      account={
        <>
          <p className="font-body text-sm font-bold text-black truncate flex items-center gap-1.5">
            <Icon name="admin_panel_settings" size={18} />
            {user?.name || "Administrator"}
          </p>
          <p className="font-body text-xs text-black/60 truncate">{user?.email}</p>
        </>
      }
    />
  );
};

export default AdminLayout;
