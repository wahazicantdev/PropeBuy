import { useState } from "react";
import { Link, Outlet } from "react-router-dom";

// Seller shell — left vertical on desktop, top bar + drawer on phone
const SellerLayout = () => {
  // Drawer state for phone
  const [open, setOpen] = useState(false);
  // Shared links — single source, reused both views
  const links = [
    { to: "/seller/dashboard", label: "Dashboard" },
    { to: "/seller/products", label: "My Products" },
    { to: "/seller/add-product", label: "Add Product" },
    { to: "/seller/orders", label: "Orders Received" },
    { to: "/seller/inventory", label: "Inventory" },
    { to: "/seller/profile", label: "Profile" },
  ];

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
      {/* Phone drawer — slides down when open */}
      {open && (
        <nav className="md:hidden px-4 py-3 flex flex-col gap-3 border-b border-gray-100 font-body">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="py-1 hover:text-primary"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
      {/* Desktop sidebar — hidden on phone, fixed width */}
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-gray-100 p-6 sticky top-0 h-screen">
        <span className="font-header text-xl text-primary mb-8">PROPEBUY</span>
        <nav className="flex flex-col gap-4 font-body text-sm">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-primary">
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>
      {/* Content — full width on phone, rest on desktop */}
      <main className="flex-1 w-full px-4 py-6 md:px-8 max-w-full overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
};

export default SellerLayout;
