import { useState } from "react";
import { Link } from "react-router-dom";

// Slim top nav — logo + links, hamburger on phone
const PublicNav = () => {
  // Mobile toggle
  const [open, setOpen] = useState(false);

  return (
    // Sticky white bar, minimalist border
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Text logo — Norwester bold */}
        <Link
          to="/"
          className="font-header font-bold text-xl text-primary tracking-wide"
        >
          PROPEBUY
        </Link>
        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-6 font-body text-sm">
          <Link to="/browse" className="text-passive hover:text-primary">
            Browse
          </Link>
          <Link to="/login/buyer" className="text-passive hover:text-primary">
            Buyer Login
          </Link>
          <Link to="/login/seller" className="text-passive hover:text-primary">
            Seller Login
          </Link>
          <Link
            to="/register"
            className="bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90"
          >
            Register
          </Link>
        </nav>
        {/* Hamburger — phone only, text glyph not emoji */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-2xl"
          aria-label="Menu"
        >
          {open ? "✕" : "☰"}
        </button>
      </div>
      {/* Phone stack */}
      {open && (
        <nav className="md:hidden px-4 pb-4 flex flex-col gap-3 font-body border-t border-gray-100 pt-3">
          <Link to="/browse" onClick={() => setOpen(false)}>
            Browse
          </Link>
          <Link to="/login/buyer" onClick={() => setOpen(false)}>
            Buyer Login
          </Link>
          <Link to="/login/seller" onClick={() => setOpen(false)}>
            Seller Login
          </Link>
          <Link
            to="/register"
            onClick={() => setOpen(false)}
            className="bg-primary text-white px-4 py-2 rounded-lg text-center"
          >
            Register
          </Link>
        </nav>
      )}
    </header>
  );
};

export default PublicNav;
