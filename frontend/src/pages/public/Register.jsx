import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import PublicNav from "../../components/PublicNav.jsx";
import Select from "../../components/Select.jsx";
import { registerUser } from "../../api/auth.api.js";
import { fetchBarangays } from "../../api/product.api.js";
import { useAuthStore } from "../../stores/auth.store.js";

// Register — buyer or seller plus 2 docs upload
const Register = () => {
  // Text fields via hook-form, dropdowns via state for the custom Select
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  // Role and barangay held in state since custom Select is controlled
  const [role, setRole] = useState("BUYER");
  const [barangayId, setBarangayId] = useState("");
  // Files via state (File objects)
  const [idDoc, setIdDoc] = useState(null);
  const [certDoc, setCertDoc] = useState(null);
  // Dropdown options
  const [barangays, setBarangays] = useState([]);
  // Block double submit
  const [loading, setLoading] = useState(false);
  // Store plus nav
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  // Role options for the custom dropdown
  const roleOptions = [
    { value: "BUYER", label: "Buyer" },
    { value: "SELLER", label: "Seller" },
  ];
  // Barangay options with a prompt entry first
  const barangayOptions = [
    { value: "", label: "Select barangay" },
    ...barangays.map((b) => ({ value: String(b.id), label: b.name })),
  ];

  // Load barangays once
  useEffect(() => {
    fetchBarangays()
      .then((res) => setBarangays(res.data || []))
      .catch(() => toast.error("Failed to load barangays"));
  }, []);

  // Submit — FormData for multer fields
  const onSubmit = async (values) => {
    // Barangay required, backend cross-checks documents against it
    if (!barangayId) return toast.error("Please select your barangay");
    // Backend requires both docs
    if (!idDoc || !certDoc)
      return toast.error("Upload both ID and Barangay Certificate");
    setLoading(true);
    try {
      // Build multipart body
      const fd = new FormData();
      fd.append("name", values.name);
      fd.append("email", values.email);
      fd.append("password", values.password);
      fd.append("role", role);
      fd.append("barangayId", barangayId);
      fd.append("idDocument", idDoc);
      fd.append("certDocument", certDoc);
      // POST /auth/register
      const res = await registerUser(fd);
      // Save session globally
      login(res.data, res.token);
      // OCR-aware message from backend
      toast.success(res.message);
      // Role redirect
      if (res.data.role === "SELLER")
        navigate(
          res.data.accountStatus === "VERIFIED"
            ? "/seller/dashboard"
            : "/seller/profile",
        );
      else navigate("/browse");
    } catch (err) {
      // Validator array first, else message
      const msg =
        err.response?.data?.errors?.[0]?.message ||
        err.response?.data?.message ||
        "Registration failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <PublicNav />
      {/* Narrow centered card */}
      <main className="max-w-lg mx-auto px-4 py-8">
        <h1 className="font-header font-bold text-2xl text-gray-900">
          Create account
        </h1>
        <p className="font-body text-sm text-passive mt-1">
          ID plus Barangay Certificate required for verification.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          {/* Name */}
          <div>
            <input
              {...register("name", { required: "Name required" })}
              placeholder="Full name"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 font-body text-sm focus:outline-primary"
            />
            {errors.name && (
              <p className="text-danger text-xs mt-1">{errors.name.message}</p>
            )}
          </div>
          {/* Email */}
          <div>
            <input
              {...register("email", { required: "Email required" })}
              type="email"
              placeholder="Email"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 font-body text-sm focus:outline-primary"
            />
            {errors.email && (
              <p className="text-danger text-xs mt-1">{errors.email.message}</p>
            )}
          </div>
          {/* Password */}
          <div>
            <input
              {...register("password", {
                required: "Password required",
                minLength: { value: 6, message: "Min 6 chars" },
              })}
              type="password"
              placeholder="Password (min 6)"
              className="w-full border border-gray-200 rounded-lg px-4 py-3 font-body text-sm focus:outline-primary"
            />
            {errors.password && (
              <p className="text-danger text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>
          {/* Role plus barangay — custom dropdowns */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              value={role}
              onChange={setRole}
              options={roleOptions}
              ariaLabel="Select role"
            />
            <Select
              value={barangayId}
              onChange={setBarangayId}
              options={barangayOptions}
              ariaLabel="Select barangay"
            />
          </div>
          {/* File pickers */}
          <div className="grid gap-4">
            <label className="border border-dashed border-gray-300 rounded-lg p-4 font-body text-sm text-passive cursor-pointer">
              Government ID {idDoc ? `— ${idDoc.name}` : ""}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setIdDoc(e.target.files[0])}
              />
            </label>
            <label className="border border-dashed border-gray-300 rounded-lg p-4 font-body text-sm text-passive cursor-pointer">
              Barangay Certificate {certDoc ? `— ${certDoc.name}` : ""}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setCertDoc(e.target.files[0])}
              />
            </label>
          </div>
          {/* Submit */}
          <button
            disabled={loading}
            className="w-full bg-primary text-white font-body py-3 rounded-lg disabled:opacity-50"
          >
            {loading ? "Verifying documents..." : "Register"}
          </button>
        </form>
        <p className="font-body text-sm text-passive mt-4 text-center">
          Have an account?{" "}
          <Link to="/login/buyer" className="text-primary">
            Login
          </Link>
        </p>
      </main>
    </div>
  );
};

export default Register;
