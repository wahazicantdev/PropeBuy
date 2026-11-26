import { Router } from "express";
import { createReport } from "../controllers/report.controller.js";
import { protect, authorize } from "../middleware/auth.middleware.js";

const reportRoutes = Router();

// Buyers report a product, its delivery fee, or the store behind an order.
// Staff review them under /api/admin/reports.
reportRoutes.post("/", protect, authorize("BUYER"), createReport);

export default reportRoutes;
