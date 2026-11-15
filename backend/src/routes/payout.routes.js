import { Router } from "express";
import { getMyEarnings, updatePayoutAccount } from "../controllers/payout.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const payoutRoutes = Router();

// ── SELLER EARNINGS ────────────────────────────────────
// Balances, history and the GCash account payouts are sent to
payoutRoutes.get("/me", protect, authorize("SELLER"), getMyEarnings);
payoutRoutes.put("/me/account", protect, authorize("SELLER"), updatePayoutAccount);

export default payoutRoutes;
