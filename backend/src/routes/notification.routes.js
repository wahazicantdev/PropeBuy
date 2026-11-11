import { Router } from "express";
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notification.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { validateIdParam } from "../middleware/validate.middleware.js";

const notificationRoutes = Router();

// Every role has a bell, so login is the only requirement
notificationRoutes.get("/", protect, getMyNotifications);
notificationRoutes.put("/read-all", protect, markAllNotificationsRead);
notificationRoutes.put("/:id/read", protect, validateIdParam, markNotificationRead);

export default notificationRoutes;
