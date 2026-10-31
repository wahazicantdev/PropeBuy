import { useState } from "react";
import { Link, NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store.js";
import { useCartStore } from "../stores/cart.store.js";
import Icon from "./Icon.jsx";

// Public top nav — SHOP.CO header: black announcement bar for guests,
// logo, text links, pill search, icon buttons. Links still switch by
// auth state and role, exactly like before the redesign.
const PublicNav = () => {
  // Phone drawer + phone search row
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  // Announcement bar — dismiss lasts for this page view only
  const [promo, setPromo] = useState(true);
  // Auth state plus logout plus redirect
  const { isAuthenticated, user, logout } = useAuthStore();
  // Cart count badge for buyers
  const getTotalItems = useCartStore((s) => s.getTotalItems);
  const navigate = useNavigate();
  // Search box starts from the URL, so /browse?search=x shows "x"
  const [urlParams] = useSearchParams();
  const [query, setQuery] = useState(urlParams.get("search") || "");

  // Role flags — one place, read everywhere below
  const isSeller = user?.role === "SELLER";
  const isAdmin = user?.role === "ADMIN";
  const showCart = !isAuthenticated || user?.role === "BUYER";
  const cartCount = getTotalItems();

  // Logout clears session and lands on landing
  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  // Search submits to Browse — the URL carries the term, so results
  // are shareable and Browse reads it as its single source of truth
  const submitSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    setSearchOpen(false);
    navigate(q ? `/browse?search=${encodeURIComponent(q)}` : "/browse");
  };

  // Role home for the logo tap — buyers browse, sellers dash, admins dash
  const homePath = !isAuthenticated
    ? "/"
    : isSeller
      ? "/seller/dashboard"
      : isAdmin
        ? "/admin/dashboard"
        : "/browse";

  // Account icon target — login for guests, own area for members
  const accountPath = !isAuthenticated
    ? "/login/buyer"
    : isSeller
      ? "/seller/profile"
      : isAdmin
        ? "/admin/dashboard"
        : "/profile";

  // Text links per state — guests see doors in, members see their pages
  const links = !isAuthenticated
    ? [
        { to: "/browse", label: "Shop" },
        { to: "/register", label: "Sell on PropeBuy" },
        { to: "/login/seller", label: "Seller Login" },
      ]
    : isSeller
      ? [
          { to: "/browse", label: "Shop" },
          { to: "/seller/dashboard", label: "Dashboard" },
        ]
      : isAdmin
        ? [
            { to: "/browse", label: "Shop" },
            { to: "/admin/dashboard", label: "Admin Portal" },
          ]
        : [
            { to: "/browse", label: "Shop" },
            { to: "/orders", label: "My Orders" },
          ];

  // Shared NavLink look — black when active, 60% black otherwise
  const linkClass = ({ isActive }) =>
    `font-body text-base ${isActive ? "text-black font-medium" : "text-black/60 hover:text-black"}`;

  // Pill search field — reused by the desktop bar and the phone row
  const searchField = (
    <form onSubmit={submitSearch} className="relative w-full" role="search">
      <Icon
        name="search"
        size={22}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40 pointer-events-none"
      />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for local goods..."
        aria-label="Search products"
        className="w-full py-3 pl-12 pr-4 font-body text-sm"
      />
    </form>
  );

  return (
    <>
      {/* ── ANNOUNCEMENT BAR — guests only, like the reference ── */}
      {!isAuthenticated && promo && (
        <div className="bg-primary text-white">
          <div className="relative max-w-7xl mx-auto px-10 py-2.5 text-center font-body text-xs md:text-sm">
            Shop verified barangay vendors — pay cash or GCash.{" "}
            <Link to="/register" className="font-medium underline">
              Sign up now
            </Link>
            {/* Dismiss — desktop and phone */}
            <button
              onClick={() => setPromo(false)}
              aria-label="Close announcement"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN HEADER — sticky, white ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-black/10">
        <div className="max-w-7xl mx-auto px-4 h-16 md:h-24 flex items-center gap-4 md:gap-10">
          {/* Phone menu button — left of the logo, reference layout */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-1 -ml-1"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            <Icon name={open ? "close" : "menu"} size={24} />
          </button>

          {/* Logo — display font, home follows role */}
          <Link
            to={homePath}
            className="font-header text-2xl md:text-[32px] text-black shrink-0"
          >
            PropeBuy
          </Link>

          {/* Desktop text links */}
          <nav className="hidden md:flex items-center gap-6 shrink-0">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkClass}>
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop search — takes the free middle space */}
          <div className="hidden md:block flex-1 min-w-0">{searchField}</div>

          {/* Icon cluster — pushed right on phone */}
          <div className="ml-auto md:ml-0 flex items-center gap-3 md:gap-4">
            {/* Phone search toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="md:hidden p-1"
              aria-label="Search"
            >
              <Icon name="search" size={24} />
            </button>
            {/* Cart with live count — guests and buyers only */}
            {showCart && (
              <Link to="/cart" className="relative p-1" aria-label="Cart">
                <Icon name="shopping_cart" size={24} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-white font-body text-[11px] font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
            {/* Account — login for guests, own area for members */}
            <Link to={accountPath} className="p-1" aria-label="Account">
              <Icon name="person" size={24} />
            </Link>
            {/* Desktop logout — members only */}
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="hidden md:block p-1 text-black/60 hover:text-danger"
                aria-label="Log out"
                title="Log out"
              >
                <Icon name="logout" size={24} />
              </button>
            )}
          </div>
        </div>

        {/* Phone search row */}
        {searchOpen && (
          <div className="md:hidden px-4 pb-3 pop-enter">{searchField}</div>
        )}

        {/* Phone drawer */}
        {open && (
          <nav className="md:hidden px-4 pb-5 pt-3 flex flex-col gap-4 border-t border-black/10 pop-enter">
            {/* Name plate proves login at a glance */}
            {isAuthenticated && (
              <p className="font-body text-sm text-passive">
                Hi, {user?.name || "member"}
              </p>
            )}
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={linkClass}
              >
                {l.label}
              </NavLink>
            ))}
            {/* Doors in for guests, door out for members */}
            {!isAuthenticated ? (
              <div className="flex gap-3 pt-2">
                <Link
                  to="/login/buyer"
                  onClick={() => setOpen(false)}
                  className="btn-outline flex-1 py-3 text-center font-body font-medium"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="btn-primary flex-1 py-3 text-center font-body font-medium"
                >
                  Sign up
                </Link>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 font-body text-base text-black/60 hover:text-danger"
              >
                <Icon name="logout" />
                Log out
              </button>
            )}
          </nav>
        )}
      </header>
    </>
  );
};

export default PublicNav;
