import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { useAuthStore } from "../stores/auth.store.js";

// Window event every socket message re-broadcasts. Pages subscribe
// through useLiveTick() and refetch, so order and stock screens update
// without a manual page refresh — objective 1e, word for word.
export const LIVE_EVENT = "propebuy:live";

// Socket hook — realtime order/payment/low-stock alerts.
// Mounted ONCE in App.jsx so one connection serves every portal.
export const useSocket = () => {
  // Ref holds socket, survives re-renders
  const socketRef = useRef(null);
  // User id decides whether to connect at all, token proves identity
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    // Guests and logged-out users get no connection
    if (!user?.id || !token) return;

    // Connect with the same JWT the REST API uses — the server derives
    // the room from the verified token, the client never picks it
    const socket = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:5000",
      { withCredentials: true, auth: { token } },
    );
    socketRef.current = socket;

    // Re-broadcast to pages — detail carries which event fired
    const broadcast = (type, payload) =>
      window.dispatchEvent(
        new CustomEvent(LIVE_EVENT, { detail: { type, ...payload } }),
      );

    // ── BUYER EVENTS ──
    // Names match backend notification.helper.js exactly — these were
    // camelCase before and never fired against the snake_case server
    socket.on("order_status_update", (payload) => {
      toast.success(payload.message || `Order #${payload.orderId} updated`);
      broadcast("order_status_update", payload);
    });
    socket.on("payment_confirmed", (payload) => {
      toast.success(`Payment confirmed for Order #${payload.orderId}`);
      broadcast("payment_confirmed", payload);
    });

    // ── SELLER EVENTS ──
    socket.on("new_order", (payload) => {
      toast.success(payload.message || `New order #${payload.orderId}`);
      broadcast("new_order", payload);
    });
    socket.on("low_stock_alert", (payload) => {
      // Backend field is currentStock — the old listener read .stock
      toast(
        `Low stock: ${payload.productName} (${payload.currentStock} left)`,
        { icon: "⚠️" },
      );
      broadcast("low_stock_alert", payload);
    });

    // Handshake refused — expired token. Stay quiet in the UI: the
    // axios 401 interceptor already handles logout on the next request.
    socket.on("connect_error", (err) => {
      console.warn("Realtime connection refused:", err.message);
    });

    // Cleanup on logout/unmount — StrictMode double-mount safe
    return () => socket.disconnect();
  }, [user?.id, token]);

  return socketRef;
};

// Live tick — a counter that bumps on every socket message.
// Pages add it to their fetch effect's deps:
//   const live = useLiveTick();
//   useEffect(() => { fetchX().then(setX) }, [live]);
// so a status change, payment, new order or stock drop refetches the
// open screen. Initial value 0 means the first load is unchanged.
export const useLiveTick = () => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    // Functional update — never reads a stale tick
    const onLive = () => setTick((t) => t + 1);
    window.addEventListener(LIVE_EVENT, onLive);
    return () => window.removeEventListener(LIVE_EVENT, onLive);
  }, []);
  return tick;
};
