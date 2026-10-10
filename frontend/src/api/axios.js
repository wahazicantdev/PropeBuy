import axios from "axios";

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
// Central 401/403 handling — auto logout on expired token
api.interceptors.response.use(
  (response) => response, // backend already returns { success, message, data }
  (error) => {
    // No response = backend down
    if (!error.response) {
      error.message = "Cannot reach server. Check if backend is running.";
      return Promise.reject(error);
    }
    // 401 = expired/invalid token → wipe + redirect to login
    if (error.response.status === 401) {
      localStorage.removeItem("propebuy_token");
      localStorage.removeItem("propebuy_user");
      // Avoid loop if already on login page
      if (!window.location.pathname.includes("login"))
        window.location.href = "/login/buyer";
    }
    return Promise.reject(error);
  },
);

export default api;
