import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import AuthShell from "../../components/AuthShell.jsx";
import Icon from "../../components/Icon.jsx";
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

  // Upload tile — one look for both documents, check mark once picked
  const docTile = (label, hint, icon, file, setFile) => (
    <label
      className={`flex items-center gap-4 rounded-xl border-2 border-dashed p-4 cursor-pointer transition-colors ${file ? "border-success bg-success/5" : "border-black/15 hover:border-black/40"}`}
    >
      <span className="w-11 h-11 rounded-full bg-surface flex items-center justify-center shrink-0">
        <Icon name={file ? "check_circle" : icon} className={file ? "text-success" : "text-black"} />
      </span>
      <span className="min-w-0">
        <span className="block font-body font-bold text-sm text-black">{label}</span>
        <span className="block font-body text-xs text-black/60 truncate">
          {file ? file.name : hint}
        </span>
      </span>
      <Icon name="upload_file" className="ml-auto text-black/40" />
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => setFile(e.target.files[0])}
      />
    </label>
  );

  return (
    // Shared auth frame — the pitch card explains the two documents
    <AuthShell
      variant="register"
      title="Create account"
      subtitle="Buyers and sellers both verify with a government ID and a Barangay Certificate."
      footer={
        <>
          Have an account?{" "}
          <Link to="/login/buyer" className="text-black font-bold underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <div>
          <div className="relative">
            <Icon name="person" className="absolute left-5 top-1/2 -translate-y-1/2 text-black/40 pointer-events-none" />
            <input
              {...register("name", { required: "Name required" })}
              placeholder="Full name (as on your ID)"
              autoComplete="name"
              className="w-full pl-13 pr-5 py-3.5 font-body text-sm"
            />
          </div>
          {errors.name && (
            <p className="text-danger text-xs mt-1 pl-5">{errors.name.message}</p>
          )}
        </div>
        {/* Email */}
        <div>
          <div className="relative">
            <Icon name="mail" className="absolute left-5 top-1/2 -translate-y-1/2 text-black/40 pointer-events-none" />
            <input
              {...register("email", { required: "Email required" })}
              type="email"
              placeholder="Email address"
              autoComplete="email"
              className="w-full pl-13 pr-5 py-3.5 font-body text-sm"
            />
          </div>
          {errors.email && (
            <p className="text-danger text-xs mt-1 pl-5">{errors.email.message}</p>
          )}
        </div>
        {/* Password */}
        <div>
          <div className="relative">
            <Icon name="lock" className="absolute left-5 top-1/2 -translate-y-1/2 text-black/40 pointer-events-none" />
            <input
              {...register("password", {
                required: "Password required",
                minLength: { value: 6, message: "Min 6 chars" },
              })}
              type="password"
              placeholder="Password (min 6 characters)"
              autoComplete="new-password"
              className="w-full pl-13 pr-5 py-3.5 font-body text-sm"
            />
          </div>
          {errors.password && (
            <p className="text-danger text-xs mt-1 pl-5">{errors.password.message}</p>
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
        {/* Document uploads — the dual-document verification */}
        <div className="grid gap-3 pt-2">
          {docTile("Government ID", "Any valid government-issued ID, photo", "id_card", idDoc, setIdDoc)}
          {docTile("Barangay Certificate", "Certificate of Residency, issued within 6 months", "description", certDoc, setCertDoc)}
        </div>
        {/* Submit — reading documents takes a few seconds, say so */}
        <button
          disabled={loading}
          className="btn-primary btn-active w-full py-3.5 font-body font-medium flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? <span className="spinner" /> : <Icon name="how_to_reg" />}
          {loading ? "Checking your documents..." : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
};

export default Register;
