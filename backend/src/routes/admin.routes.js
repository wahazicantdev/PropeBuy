import { Router } from "express";
import {
  getPendingVerifications,
  verifyUser,
  getAllUsers,
  getUser,
  suspendUser,
  getAllProducts,
  removeProduct,
  getAllOrders,
  addBarangay,
  toggleBarangay,
  addCategory,
  toggleCategory,
  rerunOCR,
  getUserOCRDetails,
  getUserDocumentLink,
  getAllBarangays,
  getAllCategories,
} from "../controllers/admin.controller.js";
import {
  getPayoutOverview,
  recordPayout,
  markRefunded,
} from "../controllers/payout.controller.js";
import {
  listStaff,
  createStaff,
  setStaffActive,
  getActivityLog,
  getBarangayInsights,
} from "../controllers/staff.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { allowAdmin } from "../middleware/adminAccess.middleware.js";
import {
  validateVerifyUser,
  validateAddBarangay,
  validateAddCategory,
  validateIdParam,
} from "../middleware/validate.middleware.js";

const adminRoutes = Router();

// ── ALL ADMIN ROUTES ───────────────────────────────────
// protect    → logged in (valid JWT)
// authorize  → role ADMIN
// allowAdmin → the staff level may use this area (Yoy, 11-18):
//   super admin everything, moderator no money/staff/settings,
//   barangay verifier only verifications and insights of their barangay
// See middleware/adminAccess.middleware.js for the full table.
const staff = (area) => [protect, authorize("ADMIN"), allowAdmin(area)];

// ── VERIFICATIONS — all three levels ───────────────────
// Verifiers see and decide only on applicants of their own barangay;
// the scoping is inside each controller.
adminRoutes.get("/users/verifications/pending", ...staff("verifications"), getPendingVerifications);

// Single user with documents. The verifications area lets a verifier
// open an applicant; the controller refuses anyone else for them.
adminRoutes.get("/users/:id", ...staff("verifications"), validateIdParam, getUser);
adminRoutes.get("/users/:id/ocr-details", ...staff("verifications"), validateIdParam, getUserOCRDetails);
adminRoutes.post("/users/:id/ocr-rerun", ...staff("verifications"), validateIdParam, rerunOCR);
// Signed link to the private ID or certificate (kind = id | certificate).
// Expires in minutes; every opening goes to the activity log.
adminRoutes.get("/users/:id/documents/:kind", ...staff("verifications"), validateIdParam, getUserDocumentLink);

// Body: { action: "approve" | "reject", barangayId: number }
adminRoutes.put(
  "/users/:id/verify",
  ...staff("verifications"),
  validateIdParam,
  validateVerifyUser,
  verifyUser,
);

// ── BARANGAY INSIGHTS — totals only ────────────────────
adminRoutes.get("/insights", ...staff("insights"), getBarangayInsights);

// ── USERS — super admin and moderators ─────────────────
adminRoutes.get("/users", ...staff("users"), getAllUsers);
adminRoutes.put("/users/:id/suspend", ...staff("users"), validateIdParam, suspendUser);

// ── PRODUCT MODERATION ─────────────────────────────────
adminRoutes.get("/products", ...staff("products"), getAllProducts);
// Body: { reason: string }
adminRoutes.put("/products/:id/remove", ...staff("products"), validateIdParam, removeProduct);

// ── ORDER OVERSIGHT ────────────────────────────────────
adminRoutes.get("/orders", ...staff("orders"), getAllOrders);

// ── SETTINGS — super admin only ────────────────────────
// Every barangay and category, active and disabled, with counts
adminRoutes.get("/barangays", ...staff("settings"), getAllBarangays);
adminRoutes.post("/barangays", ...staff("settings"), validateAddBarangay, addBarangay);
adminRoutes.put("/barangays/:id/toggle", ...staff("settings"), validateIdParam, toggleBarangay);
adminRoutes.get("/categories", ...staff("settings"), getAllCategories);
adminRoutes.post("/categories", ...staff("settings"), validateAddCategory, addCategory);
adminRoutes.put("/categories/:id/toggle", ...staff("settings"), validateIdParam, toggleCategory);

// ── MONEY — super admin only ───────────────────────────
// Who to pay, refunds due, PropeBuy income; record transfers
adminRoutes.get("/payouts", ...staff("payouts"), getPayoutOverview);
adminRoutes.post("/payouts", ...staff("payouts"), recordPayout);
adminRoutes.patch("/payouts/refunds/:id", ...staff("payouts"), validateIdParam, markRefunded);

// ── STAFF ACCOUNTS AND AUDIT LOG — super admin only ────
adminRoutes.get("/staff", ...staff("staff"), listStaff);
adminRoutes.post("/staff", ...staff("staff"), createStaff);
adminRoutes.put("/staff/:id/active", ...staff("staff"), validateIdParam, setStaffActive);
adminRoutes.get("/activity", ...staff("activity"), getActivityLog);

export default adminRoutes;
