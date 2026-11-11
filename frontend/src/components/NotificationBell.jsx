import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import Icon from "./Icon.jsx";
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../api/notification.api.js";
import { useLiveTick } from "../hooks/useSocket.js";

// "5 min ago" style label, falls back to a date after a week
const timeAgo = (iso) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric" });
};

// Bell with unread badge. The panel renders in a portal so it sits above
// any layout: buyer top bar, seller sidebar or admin header.
// side — "right" under a top bar, "left" beside the seller sidebar
const NotificationBell = ({ side = "right" }) => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ items: [], unreadCount: 0 });
  // Bumps on every socket event, so the list refreshes live
  const live = useLiveTick();
  const navigate = useNavigate();
  // Bumped by every local read action. A refresh that started before the
  // action is dropped, so it cannot bring an old unread count back.
  const version = useRef(0);

  // Load on mount, on live events, and each time the panel opens
  useEffect(() => {
    let active = true;
    const startedAt = version.current;
    fetchNotifications()
      .then((res) => {
        if (active && res.data && startedAt === version.current) setData(res.data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [live, open]);

  // Escape closes the panel
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Tap an item: mark it read right away, then go to its page
  const openItem = (item) => {
    if (!item.isRead) {
      version.current += 1;
      setData((d) => ({
        items: d.items.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)),
        unreadCount: Math.max(0, d.unreadCount - 1),
      }));
      markNotificationRead(item.id).catch(() => {});
    }
    setOpen(false);
    if (item.link) navigate(item.link);
  };

  // Clear the badge in one tap
  const readAll = () => {
    version.current += 1;
    setData((d) => ({ items: d.items.map((n) => ({ ...n, isRead: true })), unreadCount: 0 }));
    markAllNotificationsRead().catch(() => {});
  };

  const count = data.unreadCount;

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1"
        aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
      >
        <Icon name="notifications" size={24} />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-primary text-white font-body text-[11px] font-bold flex items-center justify-center">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>
      {open &&
        createPortal(
          // Clear click-catcher closes the panel when tapping outside
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)}>
            <div
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-label="Notifications"
              className={`pop-enter absolute top-16 md:top-20 ${side === "left" ? "left-4 md:left-72" : "right-4"} w-[calc(100vw-2rem)] max-w-sm bg-white rounded-xl border border-black/10 shadow-lg overflow-hidden`}
            >
              {/* Header — title plus mark all */}
              <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-black/10">
                <h2 className="font-body font-bold text-base text-black">Notifications</h2>
                {count > 0 && (
                  <button onClick={readAll} className="font-body text-xs font-bold underline text-black">
                    Mark all as read
                  </button>
                )}
              </div>
              {/* List — unread rows are shaded and bold */}
              {data.items.length === 0 ? (
                <p className="px-4 py-10 text-center font-body text-sm text-black/60">
                  No notifications yet
                </p>
              ) : (
                <ul className="max-h-[70vh] overflow-y-auto divide-y divide-black/10">
                  {data.items.map((n) => (
                    <li key={n.id}>
                      <button
                        onClick={() => openItem(n)}
                        className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-surface ${n.isRead ? "" : "bg-surface/60"}`}
                      >
                        <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.isRead ? "bg-transparent" : "bg-primary"}`} />
                        <span className="min-w-0">
                          <span className={`block font-body text-sm text-black ${n.isRead ? "" : "font-bold"}`}>{n.title}</span>
                          <span className="block font-body text-xs text-black/60 mt-0.5">{n.message}</span>
                          <span className="block font-body text-[11px] text-black/40 mt-1">{timeAgo(n.createdAt)}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default NotificationBell;
