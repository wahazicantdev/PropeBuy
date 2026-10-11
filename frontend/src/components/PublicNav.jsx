import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store.js";
import { useCartStore } from "../stores/cart.store.js";

// Public top nav — links switch by auth state and role
const PublicNav = () => {
  // Mobile toggle
  const [open, setOpen] = useState(false);
  // Auth state plus logout plus redirect
  const { isAuthenticated, user, logout } = useAuthStore();
  // Cart count badge for buyers
  const getTotalItems = useCartStore((s) => s.getTotalItems);
  const navigate = useNavigate();

  // Logout clears session and lands on landing
  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  // Role home for the logo tap — buyers browse, sellers dash, admins dash
  const homePath = !isAuthenticated
    ? "/"
    : user?.role === "SELLER"
      ? "/seller/dashboard"
      : user?.role === "ADMIN"
        ? "/admin/dashboard"
        : "/browse";

  // Links per state — guests see logins, members see their pages
  const renderLinks = (mobile) => {
    // Shared style helper for mobile stacking
    const row = mobile ? "py-1" : "";
    // Guest links
    if (!isAuthenticated) {
      return (
        <>
          <Link
            to="/browse"
            onClick={() => setOpen(false)}
            className={`text-passive hover:text-primary ${row}`}
          >
            Browse
          </Link>
          <Link
            to="/login/buyer"
            onClick={() => setOpen(false)}
            className={`text-passive hover:text-primary ${row}`}
          >
            Buyer Login
          </Link>
          <Link
            to="/login/seller"
            onClick={() => setOpen(false)}
            className={`text-passive hover:text-primary ${row}`}
          >
            Seller Login
          </Link>
          <Link
            to="/register"
            onClick={() => setOpen(false)}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 text-center"
          >
            Register
          </Link>
        </>
      );
    }
    // Buyer links with live cart count
    if (user?.role === "BUYER" || user?.role === "ADMIN") {
      return (
        <>
          <Link
            to="/browse"
            onClick={() => setOpen(false)}
            className={`text-passive hover:text-primary ${row}`}
          >
            Browse
          </Link>
          <Link
            to="/cart"
            onClick={() => setOpen(false)}
            className={`text-passive hover:text-primary ${row}`}
          >
            Cart{getTotalItems() > 0 ? ` (${getTotalItems()})` : ""}
          </Link>
          <Link
            to="/orders"
            onClick={() => setOpen(false)}
            className={`text-passive hover:text-primary ${row}`}
          >
            Orders
          </Link>
          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className={`text-passive hover:text-primary ${row}`}
          >
            Profile
          </Link>
          <button
            onClick={handleLogout}
            className={`text-passive hover:text-danger text-left ${row}`}
          >
            Log Out
          </button>
        </>
      );
    }
    // Seller links
    return (
      <>
        <Link
          to="/browse"
          onClick={() => setOpen(false)}
          className={`text-passive hover:text-primary ${row}`}
        >
          Browse
        </Link>
        <Link
          to="/seller/dashboard"
          onClick={() => setOpen(false)}
          className={`text-passive hover:text-primary ${row}`}
        >
          Dashboard
        </Link>
        <Link
          to="/seller/profile"
          onClick={() => setOpen(false)}
          className={`text-passive hover:text-primary ${row}`}
        >
          Profile
        </Link>
        <button
          onClick={handleLogout}
          className={`text-passive hover:text-danger text-left ${row}`}
        >
          Log Out
        </button>
      </>
    );
  };

  return (
    // Sticky white bar, minimalist border
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Text logo — Norwester bold, home follows role */}
        <Link
          to={homePath}
          className="font-header font-bold text-xl text-primary tracking-wide"
        >
          PROPEBUY
        </Link>
        {/* Desktop row — hidden on phone */}
        <nav className="hidden md:flex items-center gap-6 font-body text-sm">
          {renderLinks(false)}
        </nav>
        {/* Hamburger — phone only */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-2xl"
          aria-label="Menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>
      {/* Mobile stack */}
      {open && (
        <nav className="md:hidden px-4 pb-4 flex flex-col gap-3 font-body border-t border-gray-100 pt-3">
          {/* Name plate proves login at a glance */}
          {isAuthenticated && (
            <p className="font-body text-xs text-passive">
              Hi, {user?.name || "member"}
            </p>
          )}
          {renderLinks(true)}
        </nav>
      )}
    </header>
  );
};

export default PublicNav;
