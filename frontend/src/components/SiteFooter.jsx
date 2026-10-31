import { Link } from "react-router-dom";
import Icon from "./Icon.jsx";

// SiteFooter — SHOP.CO footer: a black call-to-action card that straddles
// the white page and the gray footer, then link columns and a bottom bar.
// The reference's newsletter box becomes the vendor sign-up pitch, since
// recruiting barangay vendors is PropeBuy's real growth loop.
const SiteFooter = () => {
  // Link columns — plain words, no tech terms on public pages
  const columns = [
    {
      title: "Shop",
      links: [
        { to: "/browse", label: "All goods" },
        { to: "/browse", label: "Browse by barangay" },
        { to: "/cart", label: "My cart" },
      ],
    },
    {
      title: "Account",
      links: [
        { to: "/login/buyer", label: "Buyer login" },
        { to: "/login/seller", label: "Seller login" },
        { to: "/register", label: "Create account" },
      ],
    },
    {
      title: "Orders",
      links: [
        { to: "/orders", label: "Track my orders" },
        { to: "/profile", label: "My profile" },
      ],
    },
  ];

  return (
    <footer className="mt-20">
      {/* CTA band — half white, half gray, so the card overlaps both */}
      <div className="bg-[linear-gradient(to_bottom,white_50%,var(--color-surface)_50%)] px-4">
        <div className="max-w-7xl mx-auto bg-primary rounded-xl px-6 py-8 md:px-16 md:py-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <h2 className="font-header text-white text-2xl md:text-4xl max-w-xl">
            Selling from home? Get verified and list for free.
          </h2>
          {/* Two doors — new vendors register, existing ones log in */}
          <div className="flex flex-col gap-3 w-full md:w-80 shrink-0">
            <Link
              to="/register"
              className="btn-active bg-white text-black rounded-full py-3 text-center font-body font-medium flex items-center justify-center gap-2"
            >
              <Icon name="storefront" />
              Become a vendor
            </Link>
            <Link
              to="/login/seller"
              className="btn-active border border-white/40 text-white rounded-full py-3 text-center font-body font-medium"
            >
              Seller login
            </Link>
          </div>
        </div>
      </div>

      {/* Gray footer body */}
      <div className="bg-surface px-4 pt-12 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
            {/* Brand block — the pilot story in one paragraph */}
            <div>
              <p className="font-header text-3xl text-black">PropeBuy</p>
              <p className="mt-4 font-body text-sm text-passive max-w-xs">
                Muntinlupa's barangay marketplace. Verified local vendors,
                stock-checked orders, cash or GCash. Now piloting in Barangay
                Poblacion.
              </p>
              {/* Trust line with the brand's verified mark */}
              <p className="mt-4 font-body text-sm text-black flex items-center gap-2">
                <Icon name="verified_user" className="text-success" />
                Every vendor is document-verified
              </p>
            </div>
            {/* Link columns */}
            {columns.map((col) => (
              <div key={col.title}>
                <p className="font-body font-medium text-sm tracking-[0.2em] uppercase text-black">
                  {col.title}
                </p>
                <ul className="mt-5 flex flex-col gap-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        to={l.to}
                        className="font-body text-sm text-passive hover:text-black"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar — credit left, accepted payments right */}
          <div className="mt-12 pt-6 border-t border-black/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <p className="font-body text-sm text-passive">
              PropeBuy © 2026 · Capstone project, Pamantasan ng Lungsod ng
              Muntinlupa
            </p>
            <div className="flex items-center gap-2">
              {/* Payment chips — the two methods the TPS supports */}
              <span className="bg-white rounded-md px-3 py-1.5 font-body text-xs font-bold text-black flex items-center gap-1.5 shadow-sm">
                <Icon name="payments" size={16} />
                Cash
              </span>
              <span className="bg-white rounded-md px-3 py-1.5 font-body text-xs font-bold text-black flex items-center gap-1.5 shadow-sm">
                <Icon name="account_balance_wallet" size={16} />
                GCash
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
