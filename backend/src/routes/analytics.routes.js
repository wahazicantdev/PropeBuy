import { Router } from "express";
import {
  getSellerAnalytics,
  getPlatformAnalytics,
} from "../controllers/analytics.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";
import { allowAdmin } from "../middleware/adminAccess.middleware.js";

const analyticsRoutes = Router();

// ── SELLER ANALYTICS ───────────────────────────────────
// Seller views their own sales performance dashboard
analyticsRoutes.get(
  "/seller",
  protect,
  authorize("SELLER"),
  getSellerAnalytics,
);

// ── PLATFORM ANALYTICS — ADMIN ONLY ───────────────────
// Admin views overall platform statistics
analyticsRoutes.get(
  "/platform",
  protect,
  authorize("ADMIN"),
  // Super admin and moderators; verifiers use Barangay Insights
  allowAdmin("dashboard"),
  getPlatformAnalytics,
);

export default analyticsRoutes;
