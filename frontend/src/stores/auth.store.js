import { create } from "zustand";
import { persist } from "zustand/middleware";

// Auth store — survives refresh via localStorage
export const useAuthStore = create(
  persist(
    (set) => ({
      // ── STATE ──
      user: null, // { id, name, email, role, accountStatus }
      token: null, // JWT string
      isAuthenticated: false, // quick check for routes

      // ── LOGIN SUCCESS ──
      // Called after login/register API returns { token, data }
      login: (user, token) => {
        // Persist for axios interceptor
        localStorage.setItem("propebuy_token", token);
        localStorage.setItem("propebuy_user", JSON.stringify(user));
        // Update store
        set({ user, token, isAuthenticated: true });
      },

      // ── LOGOUT ──
      // Wipe everything, back to public
      logout: () => {
        localStorage.removeItem("propebuy_token");
        localStorage.removeItem("propebuy_user");
        set({ user: null, token: null, isAuthenticated: false });
      },

      // ── SYNC USER ──
      // Update profile without re-login
      setUser: (user) => {
        localStorage.setItem("propebuy_user", JSON.stringify(user));
        set({ user });
      },
    }),
    {
      name: "propebuy-auth", // localStorage key for zustand
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
