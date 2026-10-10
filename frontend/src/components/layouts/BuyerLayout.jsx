import { useState } from "react";
import { Link, Outlet } from "react-router-dom";

// Buyer shell — top horizontal nav, collapses on phone
const BuyerLayout = () => {
  // Mobile menu toggle state
  const [open, setOpen] = useState(false);

  return (
    // Full height column — nav on top, content below
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar — logo left, links right on desktop */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Text logo — Norwester */}
          <Link
            to="/browse"
            className="font-header text-xl text-primary tracking-wide"
          >
            PROPEBUY
          </Link>
          {/* Desktop links — hidden on phone */}
          <nav className="hidden md:flex items-center gap-6 font-body text-sm">
            <Link to="/browse" className="hover:text-primary">
              Browse
            </Link>
            <Link to="/cart" className="hover:text-primary">
              Cart
            </Link>
            <Link to="/orders" className="hover:text-primary">
              Orders
            </Link>
            <Link to="/profile" className="text-passive hover:text-primary">
              Profile
            </Link>
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
        {/* Mobile dropdown — stacks vertically */}
        {open && (
          <nav className="md:hidden px-4 pb-4 flex flex-col gap-3 font-body text-base border-t border-gray-100 pt-3">
            <Link to="/browse" onClick={() => setOpen(false)}>
              Browse
            </Link>
            <Link to="/cart" onClick={() => setOpen(false)}>
              Cart
            </Link>
            <Link to="/orders" onClick={() => setOpen(false)}>
              Orders
            </Link>
            <Link to="/profile" onClick={() => setOpen(false)}>
              Profile
            </Link>
          </nav>
        )}
      </header>
      {/* Page content — centers on desktop, full width on phone */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default BuyerLayout;
