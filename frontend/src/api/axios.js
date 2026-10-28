import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "../stores/auth.store.js";

// Base URL — from .env, fallback to localhost:5000
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 15000, // fail fast, don't hang UI
  headers: { "Content-Type": "application/json" },
});

// ── REQUEST INTERCEPTOR ──
// Auto-attach JWT so you don't pass token manually
api.interceptors.request.use(
  (config) => {
    // Read saved token from login/register
    const token = localStorage.getItem("propebuy_token");
    // Attach as Bearer if exists
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// ── RESPONSE INTERCEPTOR ──
// Dedupe flag — parallel dying requests must not double-toast
let expiring = false;

api.interceptors.response.use(
  (response) => response, // backend already returns { success, message, data }
  (error) => {
    // No response = backend down
    if (!error.response) {
      error.message = "Cannot reach server. Check if backend is running.";
      return Promise.reject(error);
    }
    // 401 on a request that CARRIED a token = session died mid-use.
    // Login/register calls are skipped so a wrong password never logs out.
    const carriedToken = Boolean(error.config?.headers?.Authorization);
    const isAuthCall = error.config?.url?.includes("/auth/");
    if (error.response.status === 401 && carriedToken && !isAuthCall) {
      if (!expiring) {
        expiring = true;
        // Remember the role before logout wipes it
        const role = useAuthStore.getState().user?.role;
        sessionStorage.setItem(
          "propebuy_login_redirect",
          role === "SELLER" ? "/login/seller" : "/login/buyer",
        );
        // Wipes zustand + localStorage; guards then redirect on their own
        useAuthStore.getState().logout();
        toast.error("Your session expired — log in again", {
          id: "session-expired",
        });
        // Re-arm after the dust settles
        setTimeout(() => {
          expiring = false;
        }, 2000);
      }
      return new Promise(() => {});
    }
    return Promise.reject(error);
  },
);

export default api;
