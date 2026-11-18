import bcrypt from "bcryptjs";
import prisma from "../config/prismaClient.js";
import { logAdmin } from "../utils/adminLog.helper.js";
import { notifyAccountStatus } from "../utils/notification.helper.js";
import { isVerifier } from "../middleware/adminAccess.middleware.js";

// Staff accounts, the audit log and Barangay Insights (Yoy, 11-18)

const LEVELS = ["SUPER_ADMIN", "MODERATOR", "BARANGAY_VERIFIER"];
// Readable level names for the audit log
const LEVEL_LABEL = {
  SUPER_ADMIN: "Super admin",
  MODERATOR: "Moderator",
  BARANGAY_VERIFIER: "Barangay verifier",
};
// Money values from Prisma Decimals, rounded to centavos
const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

// Fields of a staff account that are safe to send back
const staffSelect = {
  id: true,
  name: true,
  email: true,
  adminLevel: true,
  accountStatus: true,
  createdAt: true,
  barangay: { select: { id: true, name: true } },
};

// ── SUPER ADMIN: LIST STAFF ────────────────────────────
// GET /api/admin/staff — every admin account, founders first
export const listStaff = async (req, res) => {
  const staff = await prisma.user.findMany({
    where: { role: "ADMIN" },
    select: staffSelect,
    orderBy: [{ adminLevel: "asc" }, { createdAt: "asc" }],
  });
  res.status(200).json({ success: true, count: staff.length, data: staff });
};

// ── SUPER ADMIN: ADD A STAFF ACCOUNT ───────────────────
// POST /api/admin/staff { name, email, password, adminLevel, barangayId }
// The super admin gives the temporary password to the new staff member
// in person. It is hashed here and never stored or logged as text.
export const createStaff = async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const adminLevel = req.body?.adminLevel;
  const barangayId = req.body?.barangayId ? Number(req.body.barangayId) : null;

  // ── CHECKS ──
  if (name.length < 2 || name.length > 100) {
    return res.status(400).json({ success: false, message: "Enter the staff member's full name" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: "Enter a valid email address" });
  }
  if (password.length < 8) {
    return res.status(400).json({ success: false, message: "The temporary password needs at least 8 characters" });
  }
  if (!LEVELS.includes(adminLevel)) {
    return res.status(400).json({ success: false, message: "Choose a staff role" });
  }
  // A verifier works for exactly one barangay
  let barangay = null;
  if (adminLevel === "BARANGAY_VERIFIER") {
    barangay = barangayId
      ? await prisma.barangay.findUnique({ where: { id: barangayId }, select: { id: true, name: true } })
      : null;
    if (!barangay) {
      return res.status(400).json({ success: false, message: "Choose the barangay this verifier works for" });
    }
  }

  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (exists) {
    return res.status(400).json({ success: false, message: "That email already has an account" });
  }

  // ── CREATE ──
  const staff = await prisma.user.create({
    data: {
      name,
      email,
      password: await bcrypt.hash(password, 10),
      role: "ADMIN",
      adminLevel,
      // Staff are trusted on creation, no documents to review
      accountStatus: "VERIFIED",
      barangayId: barangay?.id ?? null,
    },
    select: staffSelect,
  });

  logAdmin(req, "STAFF_ADDED", "STAFF", staff.id, `${name} as ${LEVEL_LABEL[adminLevel]}${barangay ? ` (${barangay.name})` : ""}`);
  res.status(201).json({ success: true, message: `${name} can now log in as ${LEVEL_LABEL[adminLevel].toLowerCase()}`, data: staff });
};

// ── SUPER ADMIN: TURN A STAFF ACCOUNT OFF OR ON ────────
// PUT /api/admin/staff/:id/active { active: true | false }
// Off logs the person out at once and blocks login. Nothing is deleted,
// so their past actions stay in the audit log.
export const setStaffActive = async (req, res) => {
  const id = Number(req.params.id);
  const active = req.body?.active === true;

  if (id === req.user.id) {
    return res.status(400).json({ success: false, message: "You cannot turn off your own account" });
  }
  const staff = await prisma.user.findFirst({
    where: { id, role: "ADMIN" },
    select: { id: true, name: true, adminLevel: true, accountStatus: true },
  });
  if (!staff) {
    return res.status(404).json({ success: false, message: "Staff account not found" });
  }
  // PropeBuy must always keep one working super admin
  if (!active && staff.adminLevel === "SUPER_ADMIN") {
    const supers = await prisma.user.count({
      where: { role: "ADMIN", adminLevel: "SUPER_ADMIN", accountStatus: "VERIFIED" },
    });
    if (supers <= 1) {
      return res.status(400).json({ success: false, message: "PropeBuy needs at least one active super admin" });
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { accountStatus: active ? "VERIFIED" : "REJECTED" },
    select: staffSelect,
  });
  // Turned off: their open pages end now, not when the token expires
  if (!active) notifyAccountStatus(id, "REJECTED", "ADMIN");

  logAdmin(req, active ? "STAFF_TURNED_ON" : "STAFF_TURNED_OFF", "STAFF", id, staff.name);
  res.status(200).json({
    success: true,
    message: active ? `${staff.name} can log in again` : `${staff.name} was logged out and can no longer log in`,
    data: updated,
  });
};

// ── SUPER ADMIN: AUDIT LOG ─────────────────────────────
// GET /api/admin/activity?action=USER_APPROVED&adminId=3
// The latest 200 actions, newest first, with who did them
export const getActivityLog = async (req, res) => {
  const where = {};
  if (req.query.action) where.action = String(req.query.action);
  if (req.query.adminId) where.adminId = Number(req.query.adminId);

  const [logs, actions] = await Promise.all([
    prisma.adminLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { admin: { select: { id: true, name: true, adminLevel: true } } },
    }),
    // Every action name used so far, for the filter chips
    prisma.adminLog.findMany({ distinct: ["action"], select: { action: true }, orderBy: { action: "asc" } }),
  ]);

  res.status(200).json({
    success: true,
    count: logs.length,
    data: { logs, actions: actions.map((a) => a.action) },
  });
};

// ── BARANGAY INSIGHTS ──────────────────────────────────
// GET /api/admin/insights?barangayId=5
// Totals only, never names or documents, so the barangay sees its local
// economy without seeing anyone's personal data. A verifier always gets
// their own barangay; the super admin and moderators can pick any.
export const getBarangayInsights = async (req, res) => {
  const barangayId = isVerifier(req) ? req.user.barangayId : Number(req.query.barangayId) || null;

  // Super admin and moderators open the page before picking a barangay
  const barangays = await prisma.barangay.findMany({
    where: { isActive: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const chosenId = barangayId || barangays[0]?.id;
  const barangay = await prisma.barangay.findUnique({ where: { id: chosenId }, select: { id: true, name: true } });
  if (!barangay) {
    return res.status(404).json({ success: false, message: "Barangay not found" });
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  // Six months back for the chart, in UTC to match the chart's month keys
  const chartStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));

  // ── PEOPLE ──
  const [buyers, sellers, pending, newThisMonth] = await Promise.all([
    prisma.user.count({ where: { barangayId: barangay.id, role: "BUYER", accountStatus: "VERIFIED" } }),
    prisma.user.count({ where: { barangayId: barangay.id, role: "SELLER", accountStatus: "VERIFIED" } }),
    prisma.user.count({ where: { barangayId: barangay.id, role: { not: "ADMIN" }, accountStatus: "PENDING" } }),
    prisma.user.count({
      where: { barangayId: barangay.id, role: { not: "ADMIN" }, accountStatus: "VERIFIED", createdAt: { gte: monthStart } },
    }),
  ]);

  // ── PRODUCTS BY CATEGORY ──
  const [productGroups, categories] = await Promise.all([
    prisma.product.groupBy({
      by: ["categoryId"],
      where: { barangayId: barangay.id, isActive: true },
      _count: { id: true },
    }),
    prisma.category.findMany({ select: { id: true, name: true } }),
  ]);
  const categoryName = (id) => categories.find((c) => c.id === id)?.name || "Others";
  const productsByCategory = productGroups
    .map((g) => ({ category: categoryName(g.categoryId), count: g._count.id }))
    .sort((a, b) => b.count - a.count);

  // ── SALES ──
  // Items sold by stores in this barangay, cancelled orders left out
  const sold = await prisma.orderItem.findMany({
    where: {
      product: { barangayId: barangay.id },
      order: { status: { not: "CANCELLED" }, createdAt: { gte: chartStart < lastMonthStart ? chartStart : lastMonthStart } },
    },
    select: {
      orderId: true,
      quantity: true,
      price: true,
      product: { select: { categoryId: true } },
      order: { select: { createdAt: true } },
    },
  });
  // Sum a slice of items: pesos and distinct orders
  const total = (rows) => ({
    sales: round2(rows.reduce((s, r) => s + Number(r.price) * r.quantity, 0)),
    orders: new Set(rows.map((r) => r.orderId)).size,
  });
  const thisMonthRows = sold.filter((r) => r.order.createdAt >= monthStart);
  const lastMonthRows = sold.filter((r) => r.order.createdAt >= lastMonthStart && r.order.createdAt < monthStart);

  // Six-month chart buckets, "YYYY-MM" like the seller dashboard chart
  const buckets = new Map();
  sold
    .filter((r) => r.order.createdAt >= chartStart)
    .forEach((r) => {
      const key = r.order.createdAt.toISOString().slice(0, 7);
      const b = buckets.get(key) || { month: key, revenue: 0, orderIds: new Set() };
      b.revenue += Number(r.price) * r.quantity;
      b.orderIds.add(r.orderId);
      buckets.set(key, b);
    });
  const chart = [...buckets.values()].map((b) => ({ month: b.month, revenue: round2(b.revenue), orders: b.orderIds.size }));

  // Top categories this month by pesos
  const byCategory = new Map();
  thisMonthRows.forEach((r) => {
    const name = categoryName(r.product.categoryId);
    byCategory.set(name, (byCategory.get(name) || 0) + Number(r.price) * r.quantity);
  });
  const topCategories = [...byCategory.entries()]
    .map(([category, sales]) => ({ category, sales: round2(sales) }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  res.status(200).json({
    success: true,
    data: {
      barangay,
      // Only the super admin and moderators may switch barangays
      barangays: isVerifier(req) ? [] : barangays,
      people: { buyers, sellers, pending, newThisMonth },
      products: { total: productsByCategory.reduce((s, p) => s + p.count, 0), byCategory: productsByCategory },
      thisMonth: total(thisMonthRows),
      lastMonth: total(lastMonthRows),
      topCategories,
      chart,
    },
  });
};
