import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
// Auth store — same source PublicNav reads, always live state
import { useAuthStore } from "../../stores/auth.store.js";
// Verified badge — UI rule: show on seller surfaces
import VerifiedBadge from "../VerifiedBadge.jsx";

// Seller shell — left vertical on desktop, top bar + drawer on phone
const SellerLayout = () => {
  // Drawer state for phone
  const [open, setOpen] = useState(false);
  // Live user + logout — logout wipes token, user, and localStorage
  const { user, logout } = useAuthStore();
  // Shared links — single source, reused by both views
  // NavLink highlights the active one in both places
  const links = [
    { to: "/seller/dashboard", label: "Dashboard" },
    { to: "/seller/products", label: "My Products" },
    { to: "/seller/add-product", label: "Add Product" },
    { to: "/seller/orders", label: "Orders Received" },
    { to: "/seller/inventory", label: "Inventory" },
    { to: "/seller/profile", label: "Profile" },
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

  return (
    // Row on desktop, column on phone
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* Phone top bar — logo + hamburger only */}
      <header className="md:hidden h-16 px-4 flex items-center justify-between border-b border-gray-100 sticky top-0 bg-white z-50">
        <span className="font-header text-lg text-primary">PROPEBUY</span>
        <button
          onClick={() => setOpen(!open)}
          className="p-2 text-2xl"
          aria-label="Menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </header>
      {/* Phone drawer — slides down when open, closes on tap */}
      {open && (
        <nav className="md:hidden px-4 py-3 flex flex-col gap-3 border-b border-gray-100 font-body">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `py-1 ${
                  isActive
                    ? "text-primary font-bold"
                    : "text-gray-600 hover:text-primary"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          {/* Same user plate as desktop — identity follows the seller */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="font-body text-sm font-bold text-gray-800 truncate">
              {user?.name}
            </p>
            <p className="font-body text-xs text-gray-500 truncate">
              {user?.email}
            </p>
            {/* Status line — honest per ProtectedRoute: pending sellers land here too */}
            {user?.accountStatus === "VERIFIED" ? (
              <div className="mt-2">
                <VerifiedBadge />
              </div>
            ) : (
              <span className="inline-block mt-2 font-body text-xs font-bold rounded-full px-3 py-1 bg-gray-100 text-gray-700">
                {user?.accountStatus === "PENDING"
                  ? "Pending verification"
                  : "Not verified"}
              </span>
            )}
            {/* Logout — every seller page has an exit door now */}
            <button
              onClick={handleLogout}
              className="mt-3 font-body text-sm font-bold text-gray-500 hover:text-danger transition-colors"
            >
              Log Out
            </button>
          </div>
        </nav>
      )}
      {/* Desktop sidebar — hidden on phone, fixed width */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-gray-100 p-6 sticky top-0 h-screen">
        <span className="font-header text-xl text-primary mb-8">PROPEBUY</span>
        <nav className="flex flex-col gap-4 font-body text-sm">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                isActive
                  ? "text-primary font-bold"
                  : "text-gray-600 hover:text-primary"
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        {/* User plate — pushed to the bottom with mt-auto */}
        <div className="mt-auto pt-4 border-t border-gray-100">
          <p className="font-body text-sm font-bold text-gray-800 truncate">
            {user?.name}
          </p>
          <p className="font-body text-xs text-gray-500 truncate">
            {user?.email}
          </p>
          {/* Status — badge when VERIFIED, gray chip otherwise */}
          {user?.accountStatus === "VERIFIED" ? (
            <div className="mt-2">
              <VerifiedBadge />
            </div>
          ) : (
            <span className="inline-block mt-2 font-body text-xs font-bold rounded-full px-3 py-1 bg-gray-100 text-gray-700">
              {user?.accountStatus === "PENDING"
                ? "Pending verification"
                : "Not verified"}
            </span>
          )}
          {/* Logout — same exit door on desktop */}
          <button
            onClick={handleLogout}
            className="mt-3 font-body text-sm font-bold text-gray-500 hover:text-danger transition-colors"
          >
            Log Out
          </button>
        </div>
      </aside>
      {/* Content — min-w-0 lets it shrink, inner cap keeps it readable */}
      <main className="flex-1 min-w-0 w-full px-4 py-6 md:px-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SellerLayout;