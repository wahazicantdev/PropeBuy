import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
// Auth store — same source every other shell reads, always live state
import { useAuthStore } from "../../stores/auth.store.js";
import Icon from "../Icon.jsx";

// Admin shell — top horizontal, SHOP.CO language: black bar on top,
// white header, black active pill with Material icons. Seven links do
// not fit at tablet width, so the row shows from lg up and a drawer
// takes over below that.
const AdminLayout = () => {
  // Mobile toggle
  const [open, setOpen] = useState(false);
  // Live admin identity + logout — logout wipes token and localStorage
  const { user, logout } = useAuthStore();

  // Shared links — single source, reused by desktop row and phone grid.
  // All 7 Phase E pages live here, nothing reachable by URL only.
  const links = [
    { to: "/admin/dashboard", label: "Dashboard", icon: "dashboard" },
    { to: "/admin/pending", label: "Verifications", icon: "how_to_reg" },
    { to: "/admin/users", label: "Users", icon: "group" },
    { to: "/admin/products", label: "Products", icon: "inventory_2" },
    { to: "/admin/orders", label: "Orders", icon: "receipt_long" },
    { to: "/admin/barangays", label: "Barangays", icon: "location_on" },
    { to: "/admin/categories", label: "Categories", icon: "category" },
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

  // Pill link look — black fill when active
  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-full px-3.5 py-2 font-body text-sm transition-colors whitespace-nowrap ${
      isActive ? "bg-primary text-white font-medium" : "text-black/60 hover:bg-surface hover:text-black"
    }`;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Black identity strip — who is signed in, like the reference top bar */}
      <div className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between gap-3 font-body text-xs md:text-sm">
          <span className="flex items-center gap-1.5 min-w-0">
            <Icon name="admin_panel_settings" size={18} />
            <span className="truncate">Admin · {user?.name || "Administrator"}</span>
          </span>
          <Link to="/browse" className="flex items-center gap-1 underline shrink-0">
            View the shop
            <Icon name="open_in_new" size={14} />
          </Link>
        </div>
      </div>

      {/* Main header — sticky white */}
      <header className="sticky top-0 z-50 bg-white border-b border-black/10">
        <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center gap-3">
          {/* Drawer toggle — below lg */}
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden p-1 -ml-1"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            <Icon name={open ? "close" : "menu"} size={24} />
          </button>
          <Link to="/admin/dashboard" className="font-header text-xl md:text-2xl text-black shrink-0">
            PropeBuy <span className="text-black/40">Admin</span>
          </Link>
          {/* Desktop row — NavLink marks the page you are on */}
          <nav className="hidden lg:flex items-center gap-1 ml-auto">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkClass}>
                <Icon name={l.icon} size={18} />
                {l.label}
              </NavLink>
            ))}
            {/* Logout — exit door on every admin page */}
            <button
              onClick={handleLogout}
              className="ml-2 p-2 rounded-full text-black/60 hover:text-danger hover:bg-danger/5"
              aria-label="Log out"
              title="Log out"
            >
              <Icon name="logout" size={20} />
            </button>
          </nav>
        </div>
        {/* Drawer — 2-col grid of pills to save scroll */}
        {open && (
          <nav className="lg:hidden px-4 pb-4 pt-3 grid grid-cols-2 gap-1 border-t border-black/10 pop-enter">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className={linkClass}>
                <Icon name={l.icon} size={18} />
                {l.label}
              </NavLink>
            ))}
            {/* Admin plate + logout — spans both columns */}
            <div className="col-span-2 mt-2 pt-3 border-t border-black/10 flex items-center gap-3">
              <div className="min-w-0">
                <p className="font-body text-sm font-bold text-black truncate">{user?.name}</p>
                <p className="font-body text-xs text-black/60 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-auto flex items-center gap-1.5 font-body text-sm font-bold text-black/60 hover:text-danger"
              >
                <Icon name="logout" size={18} />
                Log out
              </button>
            </div>
          </nav>
        )}
      </header>
      {/* min-w-0 + overflow-x-hidden — the responsive trio, grids can shrink */}
      <main className="flex-1 min-w-0 w-full max-w-7xl mx-auto px-4 py-6 md:py-8 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
