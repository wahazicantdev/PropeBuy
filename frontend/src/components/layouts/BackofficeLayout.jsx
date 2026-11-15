import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import NotificationBell from "../NotificationBell.jsx";
import Icon from "../Icon.jsx";

// Shared shell for the seller center and the admin portal, so both
// back offices look and behave the same.
// Desktop: fixed left sidebar with grouped links, account card at the bottom.
// Phone: top bar (menu, logo, bell) and a slide-down drawer.
//
// groups:   [{ title, links: [{ to, label, icon }] }]
// homePath: where the logo goes. area: "Seller center" / "Admin".
// account:  node shown in the account card (name, badge).
// onLogout: called by the Log out button.
const BackofficeLayout = ({ groups, homePath, area, account, onLogout }) => {
  // Phone drawer state
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // Close the drawer whenever the page changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Active link: black pill. Others: gray text, light hover.
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-full px-4 py-2.5 font-body text-sm transition-colors ${
      isActive ? "bg-primary text-white font-semibold" : "text-black/65 hover:bg-surface hover:text-black"
    }`;

  // Grouped link list — same markup in the sidebar and the drawer
  const nav = (
    <nav className="flex flex-col gap-5">
      {groups.map((g) => (
        <div key={g.title}>
          <p className="px-4 mb-1.5 font-body text-[11px] font-semibold tracking-[0.14em] uppercase text-black/35">
            {g.title}
          </p>
          <div className="flex flex-col gap-0.5">
            {g.links.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
                <Icon name={l.icon} size={20} />
                {l.label}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
      {/* See the marketplace the way buyers do */}
      <Link
        to="/browse"
        className="flex items-center gap-3 rounded-full px-4 py-2.5 font-body text-sm text-black/65 hover:bg-surface hover:text-black"
      >
        <Icon name="storefront" size={20} />
        View the shop
        <Icon name="open_in_new" size={16} className="ml-auto" />
      </Link>
    </nav>
  );

  // Account card — who is signed in, plus the exit
  const accountCard = (
    <div className="bg-surface rounded-xl p-4">
      {account}
      <button
        onClick={onLogout}
        className="mt-3 flex items-center gap-2 font-body text-sm font-semibold text-black/60 hover:text-danger transition-colors"
      >
        <Icon name="logout" size={18} />
        Log out
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white md:flex">
      {/* ── Phone top bar ── */}
      <header className="md:hidden h-16 px-4 flex items-center gap-3 border-b border-black/10 sticky top-0 bg-white z-50">
        <button onClick={() => setOpen(!open)} className="p-1 -ml-1" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>
          <Icon name={open ? "close" : "menu"} size={24} />
        </button>
        <Link to={homePath} className="font-logo text-xl text-black">PropeBuy</Link>
        <span className="font-body text-xs text-black/45 truncate">{area}</span>
        <div className="ml-auto">
          <NotificationBell />
        </div>
      </header>
      {/* ── Phone drawer ── */}
      {open && (
        <div className="md:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-white overflow-y-auto px-4 py-5 pop-enter">
          {nav}
          <div className="mt-6">{accountCard}</div>
        </div>
      )}

      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-black/10 sticky top-0 h-screen">
        <div className="px-6 pt-6 pb-5 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link to={homePath} className="font-logo text-2xl text-black">PropeBuy</Link>
            <p className="font-body text-xs text-black/45 mt-0.5">{area}</p>
          </div>
          <NotificationBell side="left" />
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-4">{nav}</div>
        <div className="p-4 border-t border-black/5">{accountCard}</div>
      </aside>

      {/* ── Page content ── */}
      <main className="flex-1 min-w-0 w-full px-4 py-6 md:px-8 md:py-8 overflow-x-hidden">
        <div className="max-w-6xl mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default BackofficeLayout;
