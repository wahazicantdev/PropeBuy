import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store.js";
import { adminCan, adminHome } from "../utils/adminAccess.js";

// ── GENERIC GUARD ──
// Checks auth + role in one place
const Guard = ({ allowedRoles }) => {
  // Read auth state from zustand
  const { isAuthenticated, user } = useAuthStore();
  // Not logged in → kick to buyer login
  if (!isAuthenticated) return <Navigate to="/login/buyer" replace />;
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

// ── ADMIN AREA GUARD (Yoy, 11-18) ──
// Wraps one admin page. A staff level without access to the area goes
// to its own home page instead of a page that would answer 403.
// AdminLayout waits for the staff level before rendering pages.
export const AdminArea = ({ area, children }) => {
  const user = useAuthStore((s) => s.user);
  if (!adminCan(user, area)) return <Navigate to={adminHome(user)} replace />;
  return children;
};
