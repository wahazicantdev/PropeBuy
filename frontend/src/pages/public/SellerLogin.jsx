import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import PublicNav from "../../components/PublicNav.jsx";
import { loginUser } from "../../api/auth.api.js";
import { useAuthStore } from "../../stores/auth.store.js";

// Seller login — SELLER only, status-aware redirect
const SellerLogin = () => {
  // Form state
  const { register, handleSubmit } = useForm();
  // Loading flag
  const [loading, setLoading] = useState(false);
  // Store + nav
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  // Submit — sellers only
  const onSubmit = async (v) => {
    setLoading(true);
    try {
      // POST /auth/login
      const res = await loginUser(v.email, v.password);
      // Reject non-sellers
      if (res.data.role !== "SELLER") {
        logout();
        return toast.error("This login is for sellers only");
      }
      // Save session
      login(res.data, res.token);
      toast.success("Welcome back");
      // VERIFIED → dashboard, else profile status
      navigate(
        res.data.accountStatus === "VERIFIED"
          ? "/seller/dashboard"
          : "/seller/profile",
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      <main className="max-w-md mx-auto px-4 py-10">
        <h1 className="font-header font-bold text-2xl text-gray-900">
          Seller login
        </h1>
        <p className="font-body text-sm text-passive mt-1">
          Unverified sellers land on profile status.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <input
            {...register("email", { required: true })}
            type="email"
            placeholder="Email"
            className="w-full border border-gray-200 rounded-lg px-4 py-3 font-body text-sm"
          />
          <input
            {...register("password", { required: true })}
            type="password"
            placeholder="Password"
            className="w-full border border-gray-200 rounded-lg px-4 py-3 font-body text-sm"
          />
          <button
            disabled={loading}
            className="w-full bg-primary text-white py-3 rounded-lg font-body disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="font-body text-sm text-passive mt-4 text-center">
          Want to sell?{" "}
          <Link to="/register" className="text-primary">
            Register
          </Link>
        </p>
      </main>
    </div>
  );
};

export default SellerLogin;
