import { useState } from "react";
import { Link, Outlet } from "react-router-dom";

// Admin shell — top horizontal, wraps on phone
const AdminLayout = () => {
  // Mobile toggle
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar — same pattern as buyer, different links */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            to="/admin/dashboard"
            className="font-header text-xl text-primary"
          >
            PROPEBUY ADMIN
          </Link>
          {/* Desktop row */}
          <nav className="hidden md:flex items-center gap-5 font-body text-sm">
            <Link to="/admin/dashboard" className="hover:text-primary">
              Dashboard
            </Link>
            <Link to="/admin/pending" className="hover:text-primary">
              Verifications
            </Link>
            <Link to="/admin/users" className="hover:text-primary">
              Users
            </Link>
            <Link to="/admin/products" className="hover:text-primary">
              Products
            </Link>
            <Link to="/admin/orders" className="hover:text-primary">
              Orders
            </Link>
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
          <nav className="md:hidden px-4 pb-4 pt-3 grid grid-cols-2 gap-3 font-body border-t border-gray-100">
            <Link to="/admin/dashboard" onClick={() => setOpen(false)}>
              Dashboard
            </Link>
            <Link to="/admin/pending" onClick={() => setOpen(false)}>
              Verifications
            </Link>
            <Link to="/admin/users" onClick={() => setOpen(false)}>
              Users
            </Link>
            <Link to="/admin/products" onClick={() => setOpen(false)}>
              Products
            </Link>
            <Link to="/admin/orders" onClick={() => setOpen(false)}>
              Orders
            </Link>
          </nav>
        )}
      </header>
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
