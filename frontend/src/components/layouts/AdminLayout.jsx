import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
// Auth store — same source every other shell reads, always live state
import { useAuthStore } from "../../stores/auth.store.js";

// Admin shell — top horizontal, wraps on phone
const AdminLayout = () => {
  // Mobile toggle
  const [open, setOpen] = useState(false);
  // Live admin identity + logout — logout wipes token and localStorage
  const { user, logout } = useAuthStore();

  // Shared links — single source, reused by desktop row and phone grid.
  // All 7 Phase E pages live here, nothing reachable by URL only.
  const links = [
    { to: "/admin/dashboard", label: "Dashboard" },
    { to: "/admin/pending", label: "Verifications" },
    { to: "/admin/users", label: "Users" },
    { to: "/admin/products", label: "Products" },
    { to: "/admin/orders", label: "Orders" },
    { to: "/admin/barangays", label: "Barangays" },
    { to: "/admin/categories", label: "Categories" },
  ];

  // ── LOGOUT ──
  // Same reasoning as SellerLayout: a navigate() would trip the admin
  // guard mid-render and bounce through /login/buyer. A hard reload has
  // zero redirect races and matches the axios 401 interceptor behaviour.
  const handleLogout = () => {
    // Wipes zustand state + both localStorage keys
    logout();
    // Full reload — admins share the buyer login door
    window.location.href = "/login/buyer";
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar — same pattern as buyer, different links */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <Link
            to="/admin/dashboard"
            className="font-header text-xl text-primary shrink-0"
          >
            PROPEBUY ADMIN
          </Link>
          {/* Desktop row — NavLink marks the page you are on */}
          <nav className="hidden md:flex items-center gap-5 font-body text-sm">
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
            {/* Logout — exit door on every admin page */}
            <button
              onClick={handleLogout}
              className="font-body text-sm font-bold text-gray-500 hover:text-danger transition-colors"
            >
              Log Out
            </button>
          </nav>
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 text-2xl"
            aria-label="Menu"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
        {/* Phone stack — 2-col grid to save scroll */}
        {open && (
          <nav className="md:hidden px-4 pb-4 pt-3 grid grid-cols-2 gap-3 font-body text-sm border-t border-gray-100">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  isActive ? "text-primary font-bold" : "text-gray-600"
                }
              >
                {l.label}
              </NavLink>
            ))}
            {/* Admin plate + logout — spans both columns */}
            <div className="col-span-2 mt-2 pt-3 border-t border-gray-100">
              <p className="font-body text-sm font-bold text-gray-800 truncate">
                {user?.name}
              </p>
              <p className="font-body text-xs text-gray-500 truncate">
                {user?.email}
              </p>
              <button
                onClick={handleLogout}
                className="mt-2 font-body text-sm font-bold text-gray-500 hover:text-danger transition-colors"
              >
                Log Out
              </button>
            </div>
          </nav>
        )}
      </header>
      {/* min-w-0 + overflow-x-hidden — the responsive trio, grids can shrink */}
      <main className="flex-1 min-w-0 w-full max-w-7xl mx-auto px-4 py-6 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
