import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../stores/auth.store.js";
import isTokenExpired from "../utils/token.helper.js";

// Where an expired session should land, set by the axios interceptor
const REDIRECT_KEY = "propebuy_login_redirect";

// ── GENERIC GUARD ──
// Checks auth + role in one place
const Guard = ({ allowedRoles }) => {
  // Read auth state from zustand
  const { isAuthenticated, user, token, logout } = useAuthStore();
  // Dead token on load — treat the session as over
  const expired = isAuthenticated && token && isTokenExpired(token);

  // Expired at boot — wipe session once, one toast (id dedupes it)
  useEffect(() => {
    if (expired) {
      logout();
      toast.error("Your session expired — log in again", {
        id: "session-expired",
      });
    }
  }, [expired, logout]);

  // Healthy session — clear any leftover redirect hint
  useEffect(() => {
    if (isAuthenticated && !expired) sessionStorage.removeItem(REDIRECT_KEY);
  }, [isAuthenticated, expired]);

  // Role-aware landing for expired sessions
  if (expired)
    return (
      <Navigate
        to={user?.role === "SELLER" ? "/login/seller" : "/login/buyer"}
        replace
      />
    );
  // Not logged in → login (seller page if the interceptor said so)
  if (!isAuthenticated)
    return (
      <Navigate
        to={sessionStorage.getItem(REDIRECT_KEY) || "/login/buyer"}
        replace
      />
    );
  // Wrong role → kick to home (prevents buyer opening seller pages)
  if (allowedRoles && !allowedRoles.includes(user?.role))
    return <Navigate to="/" replace />;
  // PENDING/REJECTED → block sellers from listing (buyers can still browse)
  if (
    user?.role === "SELLER" &&
    user?.accountStatus !== "VERIFIED" &&
    window.location.pathname.includes("/seller")
  ) {
    // Allow profile so they see status, block the rest
    if (!window.location.pathname.includes("profile"))
      return <Navigate to="/seller/profile" replace />;
  }
  // Passed → render child pages
  return <Outlet />;
};
// ── ROLE SHORTCUTS ──
// Use these in App.jsx, cleaner than inline checks
export const BuyerRoute = () => <Guard allowedRoles={["BUYER", "ADMIN"]} />;
export const SellerRoute = () => <Guard allowedRoles={["SELLER"]} />;
export const AdminRoute = () => <Guard allowedRoles={["ADMIN"]} />;
