import { io } from "../index.js";
import prisma from "../config/prismaClient.js";

// ── SAVE A NOTIFICATION ────────────────────────────────
// Stores it for the bell list, then tells the user's open pages to
// refresh their bell. Fire-and-forget: a failed save never fails the
// order, payment or approval that triggered it.
const saveNotification = (userId, { type, title, message, link }) => {
  prisma.notification
    .create({ data: { userId, type, title, message, link } })
    .then((saved) => io.to(`user_${userId}`).emit("notification_new", saved))
    .catch((err) => console.error("Saving notification failed:", err.message));
};

// ── SEND ORDER STATUS NOTIFICATION ────────────────────
// Pushes real-time notification to a specific user
// via their personal Socket.io room
// userId    — the user to notify
// orderId   — which order was updated
// status    — new order status
// message   — human-readable notification message
export const notifyOrderStatus = (userId, orderId, status, message) => {
  // Emit event to the user's personal room
  // Only the user with this ID will receive this notification
  io.to(`user_${userId}`).emit("order_status_update", {
    orderId,
    status,
    message,
    timestamp: new Date().toISOString(),
  });
  saveNotification(userId, {
    type: "ORDER_STATUS",
    title: `Order #${orderId} ${String(status).toLowerCase()}`,
    message,
    link: `/orders/${orderId}`,
  });
};

// ── SEND PAYMENT NOTIFICATION ──────────────────────────
// Notifies buyer when their GCash payment is confirmed
// userId  — the buyer to notify
// orderId — which order was paid
export const notifyPaymentConfirmed = (userId, orderId) => {
  io.to(`user_${userId}`).emit("payment_confirmed", {
    orderId,
    message: "Your payment has been confirmed!",
    timestamp: new Date().toISOString(),
  });
  saveNotification(userId, {
    type: "PAYMENT",
    title: "Payment confirmed",
    message: `Your payment for Order #${orderId} has been confirmed.`,
    link: `/orders/${orderId}`,
  });
};

// ── SEND LOW STOCK ALERT ───────────────────────────────
// Notifies seller when their product stock falls below threshold
// sellerId  — the seller to notify
// product   — product object with id, name, stock
export const notifyLowStock = (sellerId, product) => {
  io.to(`user_${sellerId}`).emit("low_stock_alert", {
    productId: product.id,
    productName: product.name,
    currentStock: product.stock,
    message: `Low stock alert — "${product.name}" only has ${product.stock} item(s) left`,
    timestamp: new Date().toISOString(),
  });
  saveNotification(sellerId, {
    type: "LOW_STOCK",
    title: "Low stock",
    message: `"${product.name}" only has ${product.stock} left.`,
    link: "/seller/inventory",
  });
};

// ── SEND ACCOUNT STATUS CHANGE ────────────────────────
// Tells a logged-in user the admin approved, rejected or suspended them
// userId — the account that changed
// status — VERIFIED or REJECTED
export const notifyAccountStatus = (userId, status, role) => {
  io.to(`user_${userId}`).emit("account_status", {
    status,
    message:
      status === "VERIFIED"
        ? "Your account is verified. You can now buy and sell on PropeBuy."
        : "This account was rejected or suspended. Contact your barangay administrator.",
    timestamp: new Date().toISOString(),
  });
  // Kept for the record — a rejected user sees it if the account returns
  saveNotification(userId, {
    type: "ACCOUNT",
    title: status === "VERIFIED" ? "Account verified" : "Account not verified",
    message:
      status === "VERIFIED"
        ? "Your documents were approved. You can now buy and sell on PropeBuy."
        : "Your account was rejected or suspended. Contact your barangay administrator.",
    link: role === "SELLER" ? "/seller/profile" : "/profile",
  });
};

// ── SEND NEW ORDER ALERT ───────────────────────────────
// Notifies a seller the moment a buyer's checkout commits with their
// goods inside. One order can hold items from several sellers, so the
// service calls this once per distinct seller with their item count.
// sellerId  — the seller to notify
// orderId   — the newly committed order
// itemCount — how many of THIS seller's lines are in the order
export const notifyNewOrder = (sellerId, orderId, itemCount) => {
  io.to(`user_${sellerId}`).emit("new_order", {
    orderId,
    itemCount,
    message: `New order #${orderId} — ${itemCount} item(s) from your shop`,
    timestamp: new Date().toISOString(),
  });
  saveNotification(sellerId, {
    type: "NEW_ORDER",
    title: `New order #${orderId}`,
    message: `${itemCount} item(s) from your shop were ordered.`,
    link: `/seller/orders/${orderId}`,
  });
};

// ── NEW RATING FOR A SELLER ────────────────────────────
export const notifyNewReview = (sellerId, productName, rating) => {
  saveNotification(sellerId, {
    type: "NEW_REVIEW",
    title: `New ${rating}-star rating`,
    message: `A buyer rated "${productName}" ${rating} out of 5.`,
    link: "/seller/reviews",
  });
};

// ── SELLER REPLIED TO A REVIEW ─────────────────────────
// The buyer sees the answer on the product page
export const notifyReviewReply = (buyerId, product) => {
  saveNotification(buyerId, {
    type: "NEW_REVIEW",
    title: "The seller replied to your review",
    message: `The seller answered your rating of "${product.name}".`,
    link: `/product/${product.id}`,
  });
};

// ── NEW REGISTRATION FOR ADMINS ────────────────────────
// Every admin gets a bell item when someone waits for verification
export const notifyAdminsNewRegistration = (user) => {
  prisma.user
    .findMany({ where: { role: "ADMIN" }, select: { id: true } })
    .then((admins) =>
      admins.forEach((admin) =>
        saveNotification(admin.id, {
          type: "NEW_REGISTRATION",
          title: "New registration to review",
          message: `${user.name} (${user.role === "SELLER" ? "seller" : "buyer"}) is waiting for verification.`,
          link: "/admin/pending",
        }),
      ),
    )
    .catch((err) => console.error("Admin alert failed:", err.message));
};

// ── BUYER CANCELLED AN ORDER ───────────────────────────
// Live refresh for the seller's order pages plus a bell notice
export const notifyBuyerCancelled = (sellerId, orderId) => {
  io.to(`user_${sellerId}`).emit("order_status_update", {
    orderId,
    status: "CANCELLED",
    message: `Order #${orderId} was cancelled by the buyer`,
    timestamp: new Date().toISOString(),
  });
  saveNotification(sellerId, {
    type: "ORDER_STATUS",
    title: `Order #${orderId} cancelled`,
    message: "The buyer cancelled this order. The stock is back in your inventory.",
    link: `/seller/orders/${orderId}`,
  });
};

// ── PAYOUT SENT TO A SELLER ────────────────────────────
// Bell notice after an admin records a GCash transfer
export const notifyPayoutSent = (sellerId, payout) => {
  saveNotification(sellerId, {
    type: "PAYOUT",
    title: "Payout sent",
    message: `₱${Number(payout.amount).toFixed(2)} was sent to your GCash ${payout.gcashNumber}. Reference ${payout.referenceNo}.`,
    link: "/seller/earnings",
  });
};

// ── ONLINE PAYMENT RECEIVED, FOR THE SELLER ────────────
// The buyer finished paying through PayMongo. The seller's open order
// pages refresh, and the bell keeps a record (E2E #420).
// sellerId — a seller with items in the order
// orderId  — the paid order
// feeOnly  — true when only the delivery fee of a cash order was paid
export const notifySellerPaymentReceived = (sellerId, orderId, feeOnly = false) => {
  const message = feeOnly
    ? `The buyer paid the delivery fee for Order #${orderId}. You can start processing it.`
    : `The buyer paid Order #${orderId} through GCash. You can start processing it.`;
  io.to(`user_${sellerId}`).emit("seller_payment_received", {
    orderId,
    message,
    timestamp: new Date().toISOString(),
  });
  saveNotification(sellerId, {
    type: "PAYMENT",
    title: feeOnly ? `Delivery fee paid for Order #${orderId}` : `Order #${orderId} paid`,
    message,
    link: `/seller/orders/${orderId}`,
  });
};

// ── REFUND DUE ─────────────────────────────────────────
// An order was cancelled after the buyer paid online (E2E #441).
// The buyer learns the money is coming back, and every admin gets a
// bell item that opens the Refunds due list.
// buyerId — who paid
// orderId — the cancelled order
// amount  — total to return, in pesos
export const notifyRefundDue = (buyerId, orderId, amount) => {
  const peso = `₱${Number(amount).toFixed(2)}`;
  saveNotification(buyerId, {
    type: "REFUND",
    title: `Refund coming for Order #${orderId}`,
    message: `Order #${orderId} was cancelled. Open the order and add the GCash number where PropeBuy should send your ${peso}. You get a notice with the reference number once it is sent.`,
    link: `/orders/${orderId}`,
  });
  prisma.user
    .findMany({ where: { role: "ADMIN" }, select: { id: true } })
    .then((admins) =>
      admins.forEach((admin) =>
        saveNotification(admin.id, {
          type: "REFUND",
          title: "Refund to send",
          message: `Order #${orderId} was cancelled after payment. Send ${peso} back to the buyer.`,
          link: "/admin/payouts",
        }),
      ),
    )
    .catch((err) => console.error("Refund alert failed:", err.message));
};

// ── REFUND SENT ────────────────────────────────────────
// The admin returned the money and saved the reference number
export const notifyRefundSent = (buyerId, orderId, amount, referenceNo) => {
  saveNotification(buyerId, {
    type: "REFUND",
    title: `Refund sent for Order #${orderId}`,
    message: `₱${Number(amount).toFixed(2)} was sent back to you. Reference ${referenceNo}.`,
    link: `/orders/${orderId}`,
  });
};

// ── REFUND GCASH ADDED ─────────────────────────────────
// The buyer typed where the refund goes, so every admin can send it now
export const notifyRefundGcashAdded = (orderId) => {
  prisma.user
    .findMany({ where: { role: "ADMIN" }, select: { id: true } })
    .then((admins) =>
      admins.forEach((admin) =>
        saveNotification(admin.id, {
          type: "REFUND",
          title: "Refund ready to send",
          message: `The buyer of Order #${orderId} added their GCash number. You can send the refund now.`,
          link: "/admin/payouts",
        }),
      ),
    )
    .catch((err) => console.error("Refund GCash alert failed:", err.message));
};
