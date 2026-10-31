import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
// Auth store — same source PublicNav reads, always live state
import { useAuthStore } from "../../stores/auth.store.js";
// Verified badge — UI rule: show on seller surfaces
import VerifiedBadge from "../VerifiedBadge.jsx";
import Icon from "../Icon.jsx";

// Seller shell — left vertical on desktop, top bar + drawer on phone.
// SHOP.CO language: black active pill, Material icons, gray status card.
const SellerLayout = () => {
  // Drawer state for phone
  const [open, setOpen] = useState(false);
  // Live user + logout — logout wipes token, user, and localStorage
  const { user, logout } = useAuthStore();
  // Shared links — single source, reused by both views.
  // NavLink highlights the active one in both places.
  const links = [
    { to: "/seller/dashboard", label: "Dashboard", icon: "dashboard" },
    { to: "/seller/products", label: "My Products", icon: "inventory_2" },
    { to: "/seller/add-product", label: "Add Product", icon: "add" },
    { to: "/seller/orders", label: "Orders Received", icon: "receipt_long" },
    { to: "/seller/inventory", label: "Inventory", icon: "monitoring" },
    { to: "/seller/profile", label: "Profile", icon: "person" },
  ];

  // ── LOGOUT ──
  // Why window.location instead of navigate: the seller guard would
  // bounce unauthenticated users to /login/buyer — wrong door for a seller.
  // A hard reload to /login/seller has zero redirect races, and matches
  // the same pattern the axios 401 interceptor already uses.
  const handleLogout = () => {
    // Wipes zustand state + both localStorage keys
    logout();
    // Full reload — clean app state on the seller login page
    window.location.href = "/login/seller";
  };

  // Pill link look — black fill when active, gray hover otherwise
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-full px-4 py-2.5 font-body text-sm transition-colors ${
      isActive ? "bg-primary text-white font-medium" : "text-black/60 hover:bg-surface hover:text-black"
    }`;

  // Status card — badge when VERIFIED, gray chip otherwise. Honest per
  // ProtectedRoute: pending sellers land on Profile and see this.
  const statusCard = (
    <div className="bg-surface rounded-xl p-4">
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
      {/* Logout — every seller page has an exit door */}
      <button
        onClick={handleLogout}
        className="mt-3 flex items-center gap-2 font-body text-sm font-bold text-black/60 hover:text-danger transition-colors"
      >
        <Icon name="logout" size={18} />
        Log out
      </button>
    </div>
  );

  return (
    // Row on desktop, column on phone
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* Phone top bar — menu, logo, shop link */}
      <header className="md:hidden h-16 px-4 flex items-center gap-3 border-b border-black/10 sticky top-0 bg-white z-50">
        <button
          onClick={() => setOpen(!open)}
          className="p-1 -ml-1"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <Icon name={open ? "close" : "menu"} size={24} />
        </button>
        <Link to="/seller/dashboard" className="font-header text-xl text-black">PropeBuy</Link>
        <Link to="/browse" className="ml-auto p-1" aria-label="Open the shop">
          <Icon name="storefront" size={24} />
        </Link>
      </header>
      {/* Phone drawer — drops down when open, closes on tap */}
      {open && (
        <nav className="md:hidden px-4 py-4 flex flex-col gap-1 border-b border-black/10 pop-enter">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className={linkClass}>
              <Icon name={l.icon} size={20} />
              {l.label}
            </NavLink>
          ))}
          <div className="mt-3">{statusCard}</div>
        </nav>
      )}

      {/* Desktop sidebar — hidden on phone, fixed width */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-black/10 p-5 sticky top-0 h-screen">
        <Link to="/seller/dashboard" className="font-header text-2xl text-black px-2">PropeBuy</Link>
        <p className="font-body text-xs text-black/40 px-2 mt-1 tracking-[0.2em] uppercase">Seller center</p>
        <nav className="mt-8 flex flex-col gap-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>
              <Icon name={l.icon} size={20} />
              {l.label}
            </NavLink>
          ))}
          {/* Shop link — see your goods the way buyers do */}
          <Link to="/browse" className="flex items-center gap-3 rounded-full px-4 py-2.5 font-body text-sm text-black/60 hover:bg-surface hover:text-black">
            <Icon name="storefront" size={20} />
            View the shop
            <Icon name="open_in_new" size={16} className="ml-auto" />
          </Link>
        </nav>
        {/* Status card — pushed to the bottom */}
        <div className="mt-auto">{statusCard}</div>
      </aside>

      {/* Content — min-w-0 lets it shrink, inner cap keeps it readable */}
      <main className="flex-1 min-w-0 w-full px-4 py-6 md:px-8 md:py-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SellerLayout;
