import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { useAuthStore } from "../stores/auth.store.js";

// Socket hook — realtime order/payment/low-stock alerts
export const useSocket = () => {
  // Ref holds socket, survives re-renders
  const socketRef = useRef(null);
  // Need user id to join personal room
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    // No user → no connection
    if (!user?.id) return;

    // Connect to backend socket server
    const socket = io(
      import.meta.env.VITE_SOCKET_URL || "http://localhost:5000",
      { withCredentials: true },
    );
    socketRef.current = socket;

    // Join personal room user_{id} — backend emits here
    socket.emit("join", user.id);

    // Order status changed (PROCESSING/FULFILLED/CANCELLED)
    socket.on("orderStatusChanged", (payload) => {
      toast.success(payload.message || `Order #${payload.orderId} updated`);
    });

    // GCash payment confirmed via webhook
    socket.on("paymentConfirmed", (payload) => {
      toast.success(`Payment confirmed for Order #${payload.orderId}`);
    });

    // Low stock warning for seller
    socket.on("lowStock", (payload) => {
      toast(`Low stock: ${payload.productName} (${payload.stock} left)`, {
        icon: "⚠️",
      });
    });

    // Cleanup on logout/unmount
    return () => socket.disconnect();
  }, [user?.id]);

  return socketRef;
};
