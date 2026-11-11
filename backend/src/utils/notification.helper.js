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
    link: "/seller/products",
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
