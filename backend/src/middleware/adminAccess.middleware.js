// ── ADMIN ROLES (Yoy, 11-18) ───────────────────────────
// Three staff levels share the ADMIN role:
//   SUPER_ADMIN       PropeBuy founders — everything, money and staff
//   MODERATOR         hired PropeBuy staff — daily moderation, no money
//   BARANGAY_VERIFIER barangay staff — verify residents of their barangay
// The frontend hides what a level cannot use, but these checks are the
// real gate: every admin route names the area it belongs to.

const SUPER = "SUPER_ADMIN";
const MOD = "MODERATOR";
const VERIFIER = "BARANGAY_VERIFIER";

// Which levels may use each area of the admin portal
export const ADMIN_AREAS = {
  dashboard: [SUPER, MOD], // platform-wide numbers
  verifications: [SUPER, MOD, VERIFIER], // pending queue, documents, approve or reject
  insights: [SUPER, MOD, VERIFIER], // Barangay Insights, totals only
  users: [SUPER, MOD], // user list and suspension
  products: [SUPER, MOD], // product moderation
  orders: [SUPER, MOD], // order oversight
  reports: [SUPER, MOD], // buyer reports: dismiss, warn, remove, suspend (11-26)
  payouts: [SUPER], // seller payouts and buyer refunds
  settings: [SUPER], // barangays and categories
  staff: [SUPER], // staff accounts
  activity: [SUPER], // audit log
};

// True when this request comes from a barangay verifier
export const isVerifier = (req) => req.user?.adminLevel === VERIFIER;

// Route guard: allowAdmin("payouts") lets only the levels listed above
// through. Use after protect and authorize("ADMIN").
export const allowAdmin = (area) => (req, res, next) => {
  const level = req.user?.adminLevel;
  if (req.user?.role !== "ADMIN" || !ADMIN_AREAS[area]?.includes(level)) {
    return res.status(403).json({
      success: false,
      message: "Your staff account does not have access to this part of the admin portal",
    });
  }
  // A verifier with no barangay would see nothing useful, and must
  // never fall back to seeing every barangay
  if (level === VERIFIER && !req.user.barangayId) {
    return res.status(403).json({
      success: false,
      message: "This verifier account has no barangay yet. Ask the PropeBuy admin to set it.",
    });
  }
  next();
};

// A verifier may open a person only while that person waits for review
// in the verifier's own barangay. Other levels may open anyone.
export const verifierMaySee = (req, user) =>
  !isVerifier(req) || (user.accountStatus === "PENDING" && user.barangayId === req.user.barangayId);
