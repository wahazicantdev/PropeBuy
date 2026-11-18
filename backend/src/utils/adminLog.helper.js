import prisma from "../config/prismaClient.js";

// ── AUDIT LOG (Yoy, 11-18) ─────────────────────────────
// Records who did what in the admin portal. Called after the action
// succeeded. Never blocks or fails the action itself: a logging error
// is printed and the admin's work still goes through.
// req        — the admin's request (req.user is the actor)
// action     — e.g. "USER_APPROVED", "PRODUCT_REMOVED"
// targetType — "USER", "PRODUCT", "ORDER", "PAYOUT", "BARANGAY", "CATEGORY", "STAFF"
// targetId   — id of the changed row, if any
// details    — short readable note. Never a password, ID number or document link.
export const logAdmin = (req, action, targetType, targetId = null, details = null) => {
  prisma.adminLog
    .create({
      data: {
        adminId: req.user.id,
        action,
        targetType,
        targetId: targetId == null ? null : Number(targetId),
        details: details ? String(details).slice(0, 300) : null,
      },
    })
    .catch((err) => console.error("Audit log failed:", err.message));
};
