// ── ADMIN ROLES (Yoy, 11-18) ───────────────────────────
// Mirror of backend/src/middleware/adminAccess.middleware.js. The
// backend is the real gate; this only decides which menu links and
// pages a staff member sees, so nobody lands on a page that answers 403.

const SUPER = "SUPER_ADMIN";
const MOD = "MODERATOR";
const VERIFIER = "BARANGAY_VERIFIER";

// Which staff levels may open each area
export const ADMIN_AREAS = {
  dashboard: [SUPER, MOD],
  verifications: [SUPER, MOD, VERIFIER],
  insights: [SUPER, MOD, VERIFIER],
  users: [SUPER, MOD],
  products: [SUPER, MOD],
  orders: [SUPER, MOD],
  payouts: [SUPER],
  settings: [SUPER],
  staff: [SUPER],
  activity: [SUPER],
};

// Readable names for each level
export const LEVEL_LABEL = {
  [SUPER]: "Super admin",
  [MOD]: "Moderator",
  [VERIFIER]: "Barangay verifier",
};

// True when this staff member may open the area
export const adminCan = (user, area) =>
  user?.role === "ADMIN" && (ADMIN_AREAS[area] || []).includes(user?.adminLevel);

// First page after login: verifiers start on their barangay's numbers,
// everyone else on the platform dashboard
export const adminHome = (user) =>
  user?.adminLevel === VERIFIER ? "/admin/insights" : "/admin/dashboard";
