import { Router } from "express";
import {
  checkout,
  getMyOrders,
  getOrder,
  getSellerOrders,
  updateOrderStatus,
  updatePaymentStatus,
  handlePaymongoWebhook,
  checkPaymentStatus,
} from "../controllers/order.controller.js";
import { validateCartItem } from "../controllers/cart.controller.js";
import {
  protect,
  authorize,
  requireVerified,
} from "../middleware/auth.middleware.js";
import {
  validateCheckout,
  validateIdParam,
} from "../middleware/validate.middleware.js";

const orderRoutes = Router();

// ── PAYMONGO WEBHOOK ───────────────────────────────────
// No auth needed — PayMongo calls this directly
// Must be registered in PayMongo dashboard as webhook URL
orderRoutes.post("/webhook/paymongo", handlePaymongoWebhook);

// ── PROTECTED ROUTES — SELLER & BUYER ────────────────────

// ── CART VALIDATION ────────────────────────────────────
// requireVerified — objective 1b says every buyer is a verified member
// of their barangay. PENDING and REJECTED (incl. suspended) accounts can
// still log in and browse, but money only moves for VERIFIED accounts.
// protect re-reads the user from the DB, so a suspension bites at once
// even while the old JWT is still valid.
orderRoutes.post(
  "/cart/validate",
  protect,
  authorize("BUYER"),
  requireVerified,
  validateCartItem,
);

// ── CHECKOUT — TPS ─────────────────────────────────────
orderRoutes.post(
  "/checkout",
  protect,
  authorize("BUYER"),
  requireVerified,
  validateCheckout,
  checkout,
);

// ── BUYER ORDER ROUTES ─────────────────────────────────
orderRoutes.get("/my-orders", protect, authorize("BUYER"), getMyOrders);

// Check GCash payment status — fallback for failed webhooks
orderRoutes.get(
  "/:id/payment-status",
  protect,
  authorize("BUYER"),
  validateIdParam,
  checkPaymentStatus,
);

orderRoutes.get("/:id", protect, validateIdParam, getOrder);

// ── SELLER ORDER ROUTES ────────────────────────────────
orderRoutes.get(
  "/seller/received",
  protect,
  authorize("SELLER"),
  getSellerOrders,
);

orderRoutes.put(
  "/:id/status",
  protect,
  authorize("SELLER"),
  validateIdParam,
  updateOrderStatus,
);

// Mark cash payment received — CASH orders only, GCash is PayMongo-owned
orderRoutes.put(
  "/:id/payment-status",
  protect,
  authorize("SELLER"),
  validateIdParam,
  updatePaymentStatus,
  
);

export default orderRoutes;
