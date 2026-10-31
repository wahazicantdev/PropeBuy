import PublicNav from "./PublicNav.jsx";
import Icon from "./Icon.jsx";

// Pitch copy per door — buyers hear about shopping, sellers about
// selling, new members about why the two documents are asked for
const PITCH = {
  buyer: {
    title: "Shop your barangay",
    points: [
      { icon: "verified_user", text: "Every vendor is document-verified" },
      { icon: "location_on", text: "Goods from your own barangay first" },
      { icon: "receipt_long", text: "Track every order, live" },
    ],
  },
  seller: {
    title: "Sell to your neighbors",
    points: [
      { icon: "storefront", text: "A free storefront for your shop" },
      { icon: "inventory_2", text: "Stock updates itself after every sale" },
      { icon: "notifications", text: "New orders pop up the moment they land" },
    ],
  },
  register: {
    title: "Join as a verified member",
    points: [
      { icon: "id_card", text: "Upload a government-issued ID" },
      { icon: "description", text: "Add your Barangay Certificate of Residency" },
      { icon: "verified", text: "Get verified and start buying or selling" },
    ],
  },
};

// AuthShell — shared frame for login and register pages.
// Desktop: black pitch card left, form right. Phone: form only, so the
// fields sit above the fold. Pages keep their own form logic untouched.
const AuthShell = ({ variant = "buyer", title, subtitle, children, footer }) => {
  const pitch = PITCH[variant];

  return (
    <div className="min-h-screen bg-white page-enter">
      <PublicNav />
      <main className="max-w-7xl mx-auto px-4 py-8 md:py-14 grid gap-10 md:grid-cols-2 items-start">
        {/* Pitch card — desktop only */}
        <aside className="hidden md:flex flex-col justify-between bg-primary rounded-xl p-10 lg:p-12 min-h-[32rem] text-white">
          <h2 className="text-4xl lg:text-5xl text-white">{pitch.title}</h2>
          <ul className="flex flex-col gap-5">
            {pitch.points.map((p) => (
              <li key={p.text} className="flex items-center gap-4 font-body text-base">
                <span className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Icon name={p.icon} size={22} />
                </span>
                {p.text}
              </li>
            ))}
          </ul>
        </aside>

        {/* Form column */}
        <section className="w-full max-w-md mx-auto md:mx-0 md:py-6 min-w-0">
          <h1 className="text-3xl md:text-4xl text-black">{title}</h1>
          {subtitle && (
            <p className="font-body text-sm md:text-base text-black/60 mt-2">{subtitle}</p>
          )}
          <div className="mt-8">{children}</div>
          {footer && (
            <p className="font-body text-sm text-black/60 mt-6 text-center">{footer}</p>
          )}
        </section>
      </main>
    </div>
  );
};

export default AuthShell;
