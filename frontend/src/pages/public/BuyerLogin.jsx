import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import AuthShell from "../../components/AuthShell.jsx";
import Icon from "../../components/Icon.jsx";
import { loginUser } from "../../api/auth.api.js";
import { useAuthStore } from "../../stores/auth.store.js";

// Buyer login — BUYER role only
const BuyerLogin = () => {
  // Form state
  const { register, handleSubmit } = useForm();
  // Loading flag
  const [loading, setLoading] = useState(false);
  // Store + nav
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  // Submit — strict buyer check
  const onSubmit = async (v) => {
    setLoading(true);
    try {
      // POST /auth/login
      const res = await loginUser(v.email, v.password);
      // Reject non-buyers here
      if (res.data.role !== "BUYER" && res.data.role !== "ADMIN") {
        logout();
        return toast.error("This login is for buyers only");
      }
      // Save + redirect
      login(res.data, res.token);
      toast.success("Welcome back");
      // Phase E: admins share this login door but belong in their portal.
      // Without this branch an admin landed on /browse and had to type
      // the admin URL by hand — bad on demo day.
      navigate(res.data.role === "ADMIN" ? "/admin/dashboard" : "/browse");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Shared auth frame — pitch card on desktop, form everywhere
    <AuthShell
      variant="buyer"
      title="Welcome back"
      subtitle="Log in to shop, check out and track your orders."
      footer={
        <>
          No account yet?{" "}
          <Link to="/register" className="text-black font-bold underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email — icon inside the gray pill */}
        <div className="relative">
          <Icon name="mail" className="absolute left-5 top-1/2 -translate-y-1/2 text-black/40 pointer-events-none" />
          <input
            {...register("email", { required: true })}
            type="email"
            placeholder="Email address"
            autoComplete="email"
            className="w-full pl-13 pr-5 py-3.5 font-body text-sm"
          />
        </div>
        {/* Password */}
        <div className="relative">
          <Icon name="lock" className="absolute left-5 top-1/2 -translate-y-1/2 text-black/40 pointer-events-none" />
          <input
            {...register("password", { required: true })}
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            className="w-full pl-13 pr-5 py-3.5 font-body text-sm"
          />
        </div>
        {/* Submit — black pill, spinner while waiting */}
        <button
          disabled={loading}
          className="btn-primary btn-active w-full py-3.5 font-body font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <span className="spinner" /> : <Icon name="login" />}
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>
    </AuthShell>
  );
};

export default BuyerLogin;
