import Icon from "./Icon.jsx";
import { cld } from "../utils/photos.js";

// Shared profile layout for buyers and sellers, so both look the same.
// Desktop: identity card on the left, editable settings on the right.
// Phone: the card stacks above the settings.
//
// user, barangayName: profile data. verifiedLabel: words for the badge.
// links: [{ to, label, icon }] shortcuts. children: right column forms.
// onLogout: log out handler. LinkComp: react-router Link.
const ProfileView = ({ user, barangayName, verifiedLabel, links = [], onLogout, LinkComp, children }) => {
  const status = user?.accountStatus;
  const verified = status === "VERIFIED";
  // Member-since, e.g. "October 2026"
  const since = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-PH", { month: "long", year: "numeric" })
    : "";
  // Detail rows — icon, label, value
  const rows = [
    { icon: "mail", label: "Email", value: user?.email || "-" },
    { icon: "location_on", label: "Barangay", value: barangayName || "-" },
    { icon: "badge", label: "Account type", value: user?.role === "SELLER" ? "Seller" : "Buyer" },
    ...(since ? [{ icon: "schedule", label: "Member since", value: since }] : []),
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_1fr] items-start">
      {/* ── Identity card ── */}
      <aside className="rounded-xl border border-black/10 overflow-hidden lg:sticky lg:top-6">
        <div className="bg-card p-6 flex items-center gap-4">
          <span className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-header text-2xl shrink-0 overflow-hidden">
            {/* Profile photo when set, else the first letter */}
            {user?.avatarUrl ? (
              <img src={cld(user.avatarUrl, 160)} alt="" className="w-full h-full object-cover" />
            ) : (
              (user?.name || "?").charAt(0).toUpperCase()
            )}
          </span>
          <div className="min-w-0">
            {/* Sellers: store name first, real name under it (private) */}
            <p className="heading-body text-xl break-words">
              {user?.role === "SELLER" && user?.storeName ? user.storeName : user?.name || "-"}
            </p>
            {user?.role === "SELLER" && user?.storeName && (
              <p className="font-body text-xs text-black/60 break-words">{user.name} (only you and the admin see this)</p>
            )}
            {/* Status in plain words; green mark only when verified */}
            <p
              className={`mt-1 font-body text-sm font-medium flex items-center gap-1.5 ${
                verified ? "text-black" : status === "REJECTED" ? "text-danger" : "text-black/60"
              }`}
            >
              <Icon
                name={verified ? "verified" : status === "REJECTED" ? "block" : "pending"}
                size={18}
                className={verified ? "text-success" : ""}
              />
              {verified ? verifiedLabel : status === "REJECTED" ? "Not verified" : "Documents under review"}
            </p>
          </div>
        </div>
        <ul className="px-5 divide-y divide-black/5">
          {rows.map((r) => (
            <li key={r.label} className="py-3.5 flex items-center gap-3 font-body text-sm min-w-0">
              <Icon name={r.icon} size={18} className="text-black/45" />
              <span className="text-black/60 shrink-0">{r.label}</span>
              <span className="ml-auto font-semibold text-right break-all">{r.value}</span>
            </li>
          ))}
        </ul>
        {/* Shortcuts and log out */}
        <div className="p-5 pt-2 grid gap-2">
          {links.map((l) => (
            <LinkComp
              key={l.to}
              to={l.to}
              className="btn-outline btn-active py-2.5 font-body text-sm font-medium flex items-center justify-center gap-2"
            >
              <Icon name={l.icon} size={18} /> {l.label}
            </LinkComp>
          ))}
          <button
            onClick={onLogout}
            className="btn-active rounded-full border border-danger/40 text-danger py-2.5 font-body text-sm font-medium flex items-center justify-center gap-2 hover:bg-danger/5"
          >
            <Icon name="logout" size={18} /> Log out
          </button>
        </div>
        <p className="px-5 pb-5 font-body text-xs text-black/45">
          Photo, email and store name can change once every 7 days in Account settings. Your
          name and barangay come from your verified documents, so ask the PropeBuy team to change them.
        </p>
      </aside>

      {/* ── Settings column ── */}
      <div className="min-w-0 space-y-5">{children}</div>
    </div>
  );
};

export default ProfileView;
