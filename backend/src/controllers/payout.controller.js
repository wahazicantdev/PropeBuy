import prisma from "../config/prismaClient.js";
import { COMMISSION_RATE, GATEWAY_FEE_RATE, WHT_RATE, WHT_THRESHOLD, round2 } from "../config/fees.js";
import { notifyPayoutSent, notifyRefundSent } from "../utils/notification.helper.js";

// Rates the pages show next to the numbers, so the UI never hardcodes them
const RATES = {
  commissionRate: COMMISSION_RATE,
  gatewayFeeRate: GATEWAY_FEE_RATE,
  withholdingRate: WHT_RATE,
  withholdingThreshold: WHT_THRESHOLD,
};

// Sums netAmount per status for one seller
const sumByStatus = async (sellerId) => {
  const rows = await prisma.sellerEarning.groupBy({
    by: ["status"],
    where: { sellerId },
    _sum: { netAmount: true },
  });
  const out = { ON_HOLD: 0, AVAILABLE: 0, PAID_OUT: 0, REFUND_DUE: 0, REFUNDED: 0 };
  rows.forEach((r) => (out[r.status] = round2(r._sum.netAmount || 0)));
  return out;
};

// ── SELLER: MY EARNINGS ────────────────────────────────
// GET /api/payouts/me — balances, this year's fees and tax, history
export const getMyEarnings = async (req, res) => {
  const sellerId = req.user.id;
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  const [totals, year, earnings, payouts, me] = await Promise.all([
    sumByStatus(sellerId),
    prisma.sellerEarning.aggregate({
      where: { sellerId, createdAt: { gte: yearStart }, status: { not: "REFUNDED" } },
      _sum: { itemsAmount: true, deliveryFee: true, commission: true, withholdingTax: true },
    }),
    prisma.sellerEarning.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { order: { select: { id: true, paymentMethod: true, status: true, createdAt: true } } },
    }),
    prisma.payout.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, amount: true, gcashNumber: true, referenceNo: true, createdAt: true },
    }),
    prisma.user.findUnique({
      where: { id: sellerId },
      select: { payoutGcashName: true, payoutGcashNumber: true },
    }),
  ]);

  res.status(200).json({
    success: true,
    message: "Earnings loaded",
    data: {
      rates: RATES,
      balances: {
        onHold: totals.ON_HOLD,
        available: totals.AVAILABLE,
        paidOut: totals.PAID_OUT,
        refundDue: totals.REFUND_DUE,
      },
      year: {
        onlineSales: round2(Number(year._sum.itemsAmount || 0) + Number(year._sum.deliveryFee || 0)),
        commission: round2(year._sum.commission || 0),
        withholdingTax: round2(year._sum.withholdingTax || 0),
      },
      account: { gcashName: me?.payoutGcashName || "", gcashNumber: me?.payoutGcashNumber || "" },
      earnings,
      payouts,
    },
  });
};

// ── SELLER: SAVE GCASH PAYOUT ACCOUNT ──────────────────
// PUT /api/payouts/me/account { gcashName, gcashNumber }
export const updatePayoutAccount = async (req, res) => {
  const gcashName = String(req.body.gcashName || "").trim();
  // Accept 09XXXXXXXXX or +639XXXXXXXXX, store as 09XXXXXXXXX
  const digits = String(req.body.gcashNumber || "").replace(/[\s-]/g, "").replace(/^\+63/, "0");
  if (gcashName.length < 2 || gcashName.length > 100) {
    return res.status(400).json({ success: false, message: "Enter the full name on the GCash account" });
  }
  if (!/^09\d{9}$/.test(digits)) {
    return res.status(400).json({ success: false, message: "Enter an 11-digit GCash number starting with 09" });
  }
  await prisma.user.update({
    where: { id: req.user.id },
    data: { payoutGcashName: gcashName, payoutGcashNumber: digits },
  });
  res.status(200).json({
    success: true,
    message: "GCash payout account saved",
    data: { gcashName, gcashNumber: digits },
  });
};

// ── ADMIN: PAYOUT OVERVIEW ─────────────────────────────
// GET /api/admin/payouts — sellers to pay, refunds due, platform income
export const getPayoutOverview = async (req, res) => {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const [available, refunds, recent, month, held] = await Promise.all([
    prisma.sellerEarning.groupBy({
      by: ["sellerId"],
      where: { status: "AVAILABLE" },
      _sum: { netAmount: true, withholdingTax: true },
      _count: { _all: true },
    }),
    prisma.sellerEarning.findMany({
      where: { status: "REFUND_DUE" },
      orderBy: { createdAt: "asc" },
      include: {
        order: { select: { id: true, paymentMethod: true, buyer: { select: { name: true, email: true } } } },
        seller: { select: { name: true, storeName: true } },
      },
    }),
    prisma.payout.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { seller: { select: { name: true } }, admin: { select: { name: true } } },
    }),
    prisma.sellerEarning.aggregate({
      where: { createdAt: { gte: monthStart }, status: { notIn: ["REFUND_DUE", "REFUNDED"] } },
      _sum: { itemsAmount: true, deliveryFee: true, commission: true, withholdingTax: true },
    }),
    prisma.sellerEarning.aggregate({ where: { status: "ON_HOLD" }, _sum: { netAmount: true } }),
  ]);

  // Seller names and payout accounts for the "to pay" list
  const sellers = await prisma.user.findMany({
    where: { id: { in: available.map((a) => a.sellerId) } },
    select: { id: true, name: true, email: true, payoutGcashName: true, payoutGcashNumber: true },
  });
  const toPay = available
    .map((a) => {
      const s = sellers.find((x) => x.id === a.sellerId);
      return {
        sellerId: a.sellerId,
        name: s?.name,
        email: s?.email,
        gcashName: s?.payoutGcashName || null,
        gcashNumber: s?.payoutGcashNumber || null,
        orders: a._count._all,
        amount: round2(a._sum.netAmount || 0),
        withholdingTax: round2(a._sum.withholdingTax || 0),
      };
    })
    .sort((x, y) => y.amount - x.amount);

  // PropeBuy's own numbers this month
  const onlineSales = Number(month._sum.itemsAmount || 0) + Number(month._sum.deliveryFee || 0);
  const commission = Number(month._sum.commission || 0);
  const gatewayFees = round2(onlineSales * GATEWAY_FEE_RATE);

  res.status(200).json({
    success: true,
    message: "Payout overview loaded",
    data: {
      rates: RATES,
      month: {
        onlineSales: round2(onlineSales),
        commission: round2(commission),
        gatewayFees,
        platformNet: round2(commission - gatewayFees),
        withholdingTax: round2(month._sum.withholdingTax || 0),
      },
      onHold: round2(held._sum.netAmount || 0),
      toPay,
      refunds,
      recent,
    },
  });
};

// ── ADMIN: RECORD A PAYOUT ─────────────────────────────
// POST /api/admin/payouts { sellerId, referenceNo }
// The admin sends the money in GCash first, then records the reference.
// Every AVAILABLE earning of the seller is included, in one transaction.
export const recordPayout = async (req, res) => {
  const sellerId = Number(req.body.sellerId);
  const referenceNo = String(req.body.referenceNo || "").trim();
  if (!Number.isInteger(sellerId) || sellerId < 1) {
    return res.status(400).json({ success: false, message: "Seller is required" });
  }
  if (referenceNo.length < 4 || referenceNo.length > 50) {
    return res.status(400).json({ success: false, message: "Enter the GCash reference number of the transfer" });
  }
  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { id: true, payoutGcashName: true, payoutGcashNumber: true },
  });
  if (!seller?.payoutGcashNumber) {
    return res.status(400).json({ success: false, message: "This seller has no GCash payout account yet" });
  }

  const payout = await prisma.$transaction(async (tx) => {
    const due = await tx.sellerEarning.findMany({
      where: { sellerId, status: "AVAILABLE" },
      select: { id: true, netAmount: true },
    });
    if (!due.length) {
      throw Object.assign(new Error("Nothing to pay this seller right now"), { statusCode: 400 });
    }
    const amount = round2(due.reduce((s, e) => s + Number(e.netAmount), 0));
    const created = await tx.payout.create({
      data: {
        sellerId,
        adminId: req.user.id,
        amount,
        gcashName: seller.payoutGcashName,
        gcashNumber: seller.payoutGcashNumber,
        referenceNo,
      },
    });
    // Only rows still AVAILABLE flip, so two admins can never pay twice
    const flipped = await tx.sellerEarning.updateMany({
      where: { id: { in: due.map((e) => e.id) }, status: "AVAILABLE" },
      data: { status: "PAID_OUT", payoutId: created.id },
    });
    if (flipped.count !== due.length) {
      throw Object.assign(new Error("These earnings changed. Refresh and try again."), { statusCode: 409 });
    }
    return created;
  });

  notifyPayoutSent(sellerId, payout);
  res.status(201).json({ success: true, message: "Payout recorded", data: payout });
};

// ── ADMIN: MARK A REFUND DONE ──────────────────────────
// PATCH /api/admin/payouts/refunds/:id { referenceNo }
// The admin sends the money back first (GCash transfer, or a PayMongo
// dashboard refund for live payments), then saves the reference.
// The buyer gets a bell notice with that reference (E2E #441).
export const markRefunded = async (req, res) => {
  const referenceNo = String(req.body?.referenceNo || "").trim();
  if (referenceNo.length < 4 || referenceNo.length > 50) {
    return res.status(400).json({ success: false, message: "Enter the reference number of the refund" });
  }
  const id = Number(req.params.id);
  // Only a row still REFUND_DUE flips, so a refund is never recorded twice
  const result = await prisma.sellerEarning.updateMany({
    where: { id, status: "REFUND_DUE" },
    data: { status: "REFUNDED", refundReference: referenceNo, refundedAt: new Date() },
  });
  if (!result.count) {
    return res.status(404).json({ success: false, message: "Refund not found or already done" });
  }
  const earning = await prisma.sellerEarning.findUnique({
    where: { id },
    select: { orderId: true, itemsAmount: true, deliveryFee: true, order: { select: { buyerId: true } } },
  });
  const amount = round2(Number(earning.itemsAmount) + Number(earning.deliveryFee));
  notifyRefundSent(earning.order.buyerId, earning.orderId, amount, referenceNo);
  res.status(200).json({ success: true, message: "Refund recorded. The buyer was notified.", data: { id } });
};
