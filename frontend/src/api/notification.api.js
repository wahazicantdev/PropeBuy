import api from "./axios.js";

// Latest notifications plus the unread count
export const fetchNotifications = async () => {
  const res = await api.get("/notifications");
  return res.data;
};

// Mark one as read
export const markNotificationRead = async (id) => {
  const res = await api.put(`/notifications/${id}/read`);
  return res.data;
};

// Mark every unread one as read
export const markAllNotificationsRead = async () => {
  const res = await api.put("/notifications/read-all");
  return res.data;
};
