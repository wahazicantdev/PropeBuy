import BackofficeLayout from "./BackofficeLayout.jsx";
// Auth store — same source PublicNav reads, always live state
import { useAuthStore } from "../../stores/auth.store.js";
// Verified badge — UI rule: show on seller surfaces
import VerifiedBadge from "../VerifiedBadge.jsx";
import Icon from "../Icon.jsx";

// Seller links, grouped like a seller center: overview, catalog, sales, account
const GROUPS = [
  { title: "Overview", links: [{ to: "/seller/dashboard", label: "Dashboard", icon: "dashboard" }] },
  {
    title: "Catalog",
    links: [
      { to: "/seller/products", label: "My products", icon: "inventory_2", end: true },
      { to: "/seller/add-product", label: "Add product", icon: "add" },
      { to: "/seller/inventory", label: "Inventory", icon: "monitoring" },
    ],
  },
  {
    title: "Sales",
    links: [
      { to: "/seller/orders", label: "Orders", icon: "receipt_long" },
      { to: "/seller/earnings", label: "Earnings", icon: "account_balance_wallet" },
      { to: "/seller/reviews", label: "Reviews", icon: "reviews" },
    ],
  },
  { title: "Account", links: [{ to: "/seller/profile", label: "Shop profile", icon: "person" }] },
];

// Seller shell — the shared back-office frame with seller links
const SellerLayout = () => {
  const { user, logout } = useAuthStore();

  // Hard reload to the seller door: the seller guard would otherwise
  // bounce a logged-out user to the buyer login mid-render
  const handleLogout = () => {
    logout();
    window.location.href = "/login/seller";
  };

  return (
    <BackofficeLayout
      groups={GROUPS}
      homePath="/seller/dashboard"
      area="Seller center"
      onLogout={handleLogout}
      account={
        <>
          <p className="font-body text-sm font-bold text-black truncate">{user?.name}</p>
          <p className="font-body text-xs text-black/60 truncate">{user?.email}</p>
          <div className="mt-2">
            {user?.accountStatus === "VERIFIED" ? (
              <VerifiedBadge />
            ) : (
              <span className="inline-flex items-center gap-1 font-body text-xs font-bold rounded-full px-3 py-1 bg-white text-black/70">
                <Icon name="pending" size={14} />
                {user?.accountStatus === "PENDING" ? "Pending verification" : "Not verified"}
              </span>
            )}
          </div>
        </>
      }
    />
  );
};

export default SellerLayout;
