import prisma from "../config/prismaClient.js";
import { cleanInt } from "../utils/format.helper.js";
import { logAdmin } from "../utils/adminLog.helper.js";
import { maxDeliveryFee } from "../config/delivery.js";
import {
  notifyAccountStatus,
  notifyAdminsNewReport,
  notifyReporterDecision,
  notifySellerReportAction,
} from "../utils/notification.helper.js";

// ── REPORTS (11-26) ────────────────────────────────────
// PropeBuy is a service between buyers and sellers, so buyers need a way
// to flag a listing or a store, and staff need one place to act on it.
//   Buyer  → POST /api/reports              from a product page or an order
//   Staff  → GET  /api/admin/reports         the queue, with each store's history
//   Staff  → PATCH /api/admin/reports/:id    dismiss, warn, remove product, suspend seller

export const REPORT_REASONS = [
  "UNFAIR_DELIVERY_FEE",
  "WRONG_WEIGHT",
  "NOT_AS_DESCRIBED",
  "PROHIBITED_ITEM",
  "SCAM",
  "SELLER_CONDUCT",
  "OTHER",
];
// These two are about one listing, so they need a product
const PRODUCT_REASONS = ["UNFAIR_DELIVERY_FEE", "WRONG_WEIGHT"];
// A buyer can file this many reports in 24 hours, so the queue stays usable
const DAILY_LIMIT = 10;
const DETAILS_MAX = 500;

const bad = (res, message, status = 400) => res.status(status).json({ success: false, message });

// Short name of what was reported, for notices and the log
const reportLabel = (product, orderId) => (product ? `"${product.name}"` : `order #${orderId}`);

// ── BUYER: FILE A REPORT ───────────────────────────────
// Body: { productId?, orderId?, reason, details? }
export const createReport = async (req, res) => {
  if (req.user.accountStatus !== "VERIFIED") {
    return bad(res, "Only verified buyers can send reports", 403);
  }
  const productId = req.body.productId ? cleanInt(req.body.productId) : null;
  const orderId = req.body.orderId ? cleanInt(req.body.orderId) : null;
  const reason = String(req.body.reason || "");
  const details = String(req.body.details || "").trim();

  if (!REPORT_REASONS.includes(reason)) return bad(res, "Choose a reason for the report");
  if (!productId && !orderId) return bad(res, "Say which product or order you are reporting");
  if (PRODUCT_REASONS.includes(reason) && !productId) {
    return bad(res, "Report a delivery fee or weight from the product's page");
  }
  if (reason === "OTHER" && details.length < 10) return bad(res, "Tell us what happened (at least 10 characters)");
  if (details.length > DETAILS_MAX) return bad(res, `Keep the details under ${DETAILS_MAX} characters`);

  // Find the store being reported
  let sellerId = null;
  let product = null;
  if (productId) {
    product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, name: true, sellerId: true } });
    if (!product) return bad(res, "Product not found", 404);
    sellerId = product.sellerId;
  }
  if (orderId) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, buyerId: req.user.id },
      select: { orderItems: { select: { productId: true, product: { select: { sellerId: true } } } } },
    });
    // Only the buyer's own orders
    if (!order) return bad(res, "Order not found", 404);
    const orderSeller = order.orderItems[0]?.product.sellerId;
    if (product && !order.orderItems.some((i) => i.productId === product.id)) {
      return bad(res, "That product is not in this order");
    }
    sellerId = sellerId ?? orderSeller;
  }
  if (!sellerId) return bad(res, "Could not find the store for this report");

  // Same open report twice adds nothing
  const duplicate = await prisma.report.findFirst({
    where: { reporterId: req.user.id, sellerId, productId, orderId, reason, status: "OPEN" },
    select: { id: true },
  });
  if (duplicate) return bad(res, "You already reported this. PropeBuy staff will review it soon.", 409);

  const today = await prisma.report.count({
    where: { reporterId: req.user.id, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
  });
  if (today >= DAILY_LIMIT) return bad(res, "You have sent many reports today. Please try again tomorrow.", 429);

  const report = await prisma.report.create({
    data: { reporterId: req.user.id, sellerId, productId, orderId, reason, details: details || null },
    select: { id: true, reason: true, status: true, createdAt: true },
  });

  notifyAdminsNewReport(report, reportLabel(product, orderId));

  res.status(201).json({
    success: true,
    message: "Report sent. PropeBuy staff will review it, and you will get a notice when they decide.",
    data: report,
  });
};

// ── STAFF: THE QUEUE ───────────────────────────────────
// ?status=OPEN|RESOLVED|DISMISSED (default OPEN)
export const getReports = async (req, res) => {
  const status = ["OPEN", "RESOLVED", "DISMISSED"].includes(req.query.status) ? req.query.status : "OPEN";

  const [reports, grouped] = await Promise.all([
    prisma.report.findMany({
      where: { status },
      orderBy: { createdAt: status === "OPEN" ? "asc" : "desc" },
      take: 500,
      include: {
        reporter: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true, storeName: true, accountStatus: true } },
        product: { select: { id: true, name: true, imageUrl: true, isActive: true, weightKg: true, deliveryFee: true, price: true } },
        handledBy: { select: { name: true } },
      },
    }),
    prisma.report.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  // Each store's history, so staff see repeat offenders at a glance
  const sellerIds = [...new Set(reports.map((r) => r.sellerId))];
  const history = sellerIds.length
    ? await prisma.report.groupBy({ by: ["sellerId", "status"], where: { sellerId: { in: sellerIds } }, _count: { _all: true } })
    : [];
  const historyOf = (sellerId) => {
    const rows = history.filter((h) => h.sellerId === sellerId);
    const n = (s) => rows.find((h) => h.status === s)?._count._all || 0;
    return { open: n("OPEN"), upheld: n("RESOLVED"), dismissed: n("DISMISSED") };
  };

  const counts = { OPEN: 0, RESOLVED: 0, DISMISSED: 0 };
  grouped.forEach((g) => (counts[g.status] = g._count._all));

  res.status(200).json({
    success: true,
    counts,
    data: reports.map((r) => ({
      ...r,
      // Fair maximum for the listed weight, for delivery fee reports
      maxDeliveryFee: r.product ? maxDeliveryFee(r.product.weightKg) : null,
      sellerHistory: historyOf(r.sellerId),
    })),
  });
};

// ── STAFF: DECIDE ──────────────────────────────────────
// Body: { action: "DISMISS" | "WARN" | "REMOVE_PRODUCT" | "SUSPEND_SELLER", note }
const ACTIONS = {
  DISMISS: { status: "DISMISSED", saved: "DISMISSED" },
  WARN: { status: "RESOLVED", saved: "WARNED" },
  REMOVE_PRODUCT: { status: "RESOLVED", saved: "PRODUCT_REMOVED" },
  SUSPEND_SELLER: { status: "RESOLVED", saved: "SELLER_SUSPENDED" },
};

export const decideReport = async (req, res) => {
  const id = cleanInt(req.params.id);
  const action = ACTIONS[req.body.action];
  const note = String(req.body.note || "").trim().slice(0, 300);
  if (!action) return bad(res, "Choose what to do with this report");
  // Any action against a seller needs a reason they can read
  if (req.body.action !== "DISMISS" && note.length < 5) {
    return bad(res, "Write a short note for the seller (at least 5 characters)");
  }

  const report = await prisma.report.findUnique({
    where: { id },
    include: {
      product: { select: { id: true, name: true, isActive: true } },
      seller: { select: { id: true, name: true, storeName: true, role: true, accountStatus: true } },
    },
  });
  if (!report) return bad(res, "Report not found", 404);
  if (report.status !== "OPEN") return bad(res, "This report was already decided");
  if (req.body.action === "REMOVE_PRODUCT" && !report.product) {
    return bad(res, "This report is about an order, not a product. Warn or suspend the seller instead.");
  }

  const label = reportLabel(report.product, report.orderId);
  const store = report.seller.storeName || report.seller.name;
  const decided = { status: action.status, action: action.saved, adminNote: note || null, handledById: req.user.id, handledAt: new Date() };

  await prisma.$transaction(async (tx) => {
    await tx.report.update({ where: { id }, data: decided });

    if (req.body.action === "REMOVE_PRODUCT" && report.product.isActive) {
      await tx.product.update({ where: { id: report.product.id }, data: { isActive: false } });
    }

    if (req.body.action === "SUSPEND_SELLER") {
      await tx.user.update({ where: { id: report.sellerId }, data: { accountStatus: "REJECTED" } });
      // The store is closed, so its other open reports close with it
      await tx.report.updateMany({
        where: { sellerId: report.sellerId, status: "OPEN", id: { not: id } },
        data: { ...decided, adminNote: `Closed with report #${id}: seller suspended` },
      });
    }
  });

  // Notices after the transaction, so nobody hears about a rollback
  if (req.body.action === "SUSPEND_SELLER") notifyAccountStatus(report.sellerId, "REJECTED", report.seller.role);
  if (req.body.action === "DISMISS") {
    notifyReporterDecision(report.reporterId, label, false, note);
  } else {
    notifyReporterDecision(report.reporterId, label, true, null);
    notifySellerReportAction(report.sellerId, label, action.saved, note);
  }

  logAdmin(req, `REPORT_${action.saved}`, "REPORT", id, `${store}, ${label}${note ? `: ${note}` : ""}`);

  res.status(200).json({ success: true, message: "Report decided", data: { id, ...decided } });
};
