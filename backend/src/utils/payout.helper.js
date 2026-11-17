import prisma from "../config/prismaClient.js";
import { COMMISSION_RATE, WHT_THRESHOLD, WHT_RATE, round2 } from "../config/fees.js";
// Refund notices for the buyer and the admins
import { notifyRefundDue } from "./notification.helper.js";

// ── SELLER EARNINGS ────────────────────────────────────
// Money flow: the buyer pays PropeBuy online, PropeBuy holds it until the
// seller fulfils the order, then sends the seller's share to their GCash.
//   ON_HOLD    paid online, order still open (protects the buyer)
//   AVAILABLE  order fulfilled, included in the next payout
//   PAID_OUT   admin sent it and recorded the reference number
//   REFUND_DUE order cancelled after payment, buyer gets the money back
//   REFUNDED   admin sent the money back and recorded the reference

// Splits an order's online payment per seller.
// GCash orders: items + delivery fee are online. Cash orders: only the
// delivery fee was paid online, the items are paid in cash.
const splitOrder = (order) => {
  const bySeller = new Map();
  for (const item of order.orderItems) {
    const sellerId = item.product.sellerId;
    const amount = Number(item.price) * item.quantity;
    bySeller.set(sellerId, (bySeller.get(sellerId) || 0) + amount);
  }
  const online = order.paymentMethod === "GCASH";
  const feePaid = Number(order.deliveryFee) > 0;
  // Delivery orders always have exactly one seller, so the fee is theirs
  return [...bySeller.entries()].map(([sellerId, items], i) => {
    const itemsAmount = online ? round2(items) : 0;
    const deliveryFee = feePaid && i === 0 ? round2(order.deliveryFee) : 0;
    const commission = round2(itemsAmount * COMMISSION_RATE);
    return {
      sellerId,
      itemsAmount,
      deliveryFee,
      commission,
      netAmount: round2(itemsAmount + deliveryFee - commission),
    };
  });
};

// Called once the online part of an order is paid. Safe to call twice:
// the (order, seller) pair is unique, so PayMongo retries add nothing.
export const createEarnings = async (orderId) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { orderItems: { include: { product: { select: { sellerId: true } } } } },
  });
  if (!order) return;
  for (const share of splitOrder(order)) {
    // Nothing paid online for this seller, nothing to hold
    if (share.itemsAmount === 0 && share.deliveryFee === 0) continue;
    await prisma.sellerEarning.upsert({
      where: { orderId_sellerId: { orderId, sellerId: share.sellerId } },
      update: {},
      create: { orderId, ...share },
    });
  }
};

// Called when the order is fulfilled. Applies the RR 16-2023 withholding
// tax if the seller's remittances this year pass the threshold, then
// makes the money available for payout.
export const releaseEarnings = async (orderId) => {
  const held = await prisma.sellerEarning.findMany({ where: { orderId, status: "ON_HOLD" } });
  const yearStart = new Date(new Date().getFullYear(), 0, 1);
  for (const e of held) {
    // Gross remittance excludes PropeBuy's own commission
    const gross = round2(Number(e.itemsAmount) + Number(e.deliveryFee) - Number(e.commission));
    const before = await prisma.sellerEarning.aggregate({
      where: {
        sellerId: e.sellerId,
        status: { in: ["AVAILABLE", "PAID_OUT"] },
        releasedAt: { gte: yearStart },
      },
      _sum: { itemsAmount: true, deliveryFee: true, commission: true },
    });
    const yearGross =
      Number(before._sum.itemsAmount || 0) +
      Number(before._sum.deliveryFee || 0) -
      Number(before._sum.commission || 0);
    const tax = yearGross + gross > WHT_THRESHOLD ? round2(gross * WHT_RATE) : 0;
    await prisma.sellerEarning.update({
      where: { id: e.id },
      data: {
        status: "AVAILABLE",
        releasedAt: new Date(),
        withholdingTax: tax,
        netAmount: round2(gross - tax),
      },
    });
  }
};

// Called when an order is cancelled. Money not yet sent to the seller
// becomes a refund the admin must return to the buyer.
// The buyer and the admins are told how much goes back (E2E #441).
export const cancelEarnings = async (orderId) => {
  const due = await prisma.sellerEarning.findMany({
    where: { orderId, status: { in: ["ON_HOLD", "AVAILABLE"] } },
    select: { id: true, itemsAmount: true, deliveryFee: true },
  });
  if (!due.length) return;
  await prisma.sellerEarning.updateMany({
    where: { id: { in: due.map((e) => e.id) } },
    data: { status: "REFUND_DUE" },
  });
  // The buyer paid items plus fee, so that whole amount goes back
  const amount = round2(due.reduce((s, e) => s + Number(e.itemsAmount) + Number(e.deliveryFee), 0));
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { buyerId: true } });
  if (order) notifyRefundDue(order.buyerId, orderId, amount);
};
