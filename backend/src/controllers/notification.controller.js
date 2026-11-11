import prisma from "../config/prismaClient.js";

// ── MY NOTIFICATIONS ───────────────────────────────────
// Latest 30 plus the unread count for the bell badge
export const getMyNotifications = async (req, res) => {
  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    }),
  ]);

  res.status(200).json({
    success: true,
    message: "Notifications loaded",
    data: { items, unreadCount },
  });
};

// ── MARK ONE AS READ ───────────────────────────────────
// userId in the filter — nobody can touch another user's notification
export const markNotificationRead = async (req, res) => {
  const result = await prisma.notification.updateMany({
    where: { id: parseInt(req.params.id), userId: req.user.id },
    data: { isRead: true },
  });

  if (result.count === 0) {
    return res.status(404).json({
      success: false,
      message: "Notification not found",
    });
  }

  res.status(200).json({
    success: true,
    message: "Notification marked as read",
    data: null,
  });
};

// ── MARK ALL AS READ ───────────────────────────────────
export const markAllNotificationsRead = async (req, res) => {
  const result = await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true },
  });

  res.status(200).json({
    success: true,
    message: "All notifications marked as read",
    data: { updated: result.count },
  });
};
