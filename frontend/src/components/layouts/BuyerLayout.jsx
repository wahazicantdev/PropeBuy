import { Outlet } from "react-router-dom";
import PublicNav from "../PublicNav.jsx";
import SiteFooter from "../SiteFooter.jsx";

// Buyer shell — the SAME header and footer as the public pages.
// Before the redesign buyers got a second, plainer nav the moment they
// opened their cart; one header everywhere means one mental model:
// search, cart badge and account icon never move.
const BuyerLayout = () => {
  return (
    // Full height column — nav on top, content, footer at the bottom
    <div className="min-h-screen bg-white flex flex-col">
      <PublicNav />
      {/* Page content — min-w-0 + overflow guard, the responsive trio */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 min-w-0 overflow-x-hidden">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  );
};

export default BuyerLayout;
