import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import AuthShell from "../../components/AuthShell.jsx";
import Icon from "../../components/Icon.jsx";
import FieldLabel from "../../components/FieldLabel.jsx";
import Select from "../../components/Select.jsx";
import {
  registerUser,
  requestEmailOtp,
  verifyEmailOtp,
} from "../../api/auth.api.js";
import { fetchBarangays } from "../../api/product.api.js";
import { useAuthStore } from "../../stores/auth.store.js";

// Register — buyer or seller plus 2 docs upload
const Register = () => {
  // Text fields via hook-form, dropdowns via state for the custom Select
  const {
    register,
    handleSubmit,
    trigger,
    getValues,
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
  // Email code steps — otpToken is the proof sent with registration
  const [codeSent, setCodeSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
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

  // Counts the resend wait down by one second at a time
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Validator message first, then the API message, then a fallback
  const readError = (err, fallback) =>
    err.response?.data?.errors?.[0]?.message ||
    err.response?.data?.message ||
    fallback;

  // Back to step 1 so a different email can be used
  const resetEmailStep = () => {
    setCodeSent(false);
    setOtpCode("");
    setOtpToken("");
  };

  // Emails a code to the address in the email field
  const sendCode = async () => {
    if (!(await trigger("email"))) return;
    setSending(true);
    try {
      const res = await requestEmailOtp(getValues("email"));
      setCodeSent(true);
      setOtpCode("");
      setCooldown(res.data.retryAfter);
      toast.success(res.message);
    } catch (err) {
      // The backend says how long to wait when the cooldown is still on
      if (err.response?.data?.retryAfter) setCooldown(err.response.data.retryAfter);
      toast.error(readError(err, "Could not send the code"));
    } finally {
      setSending(false);
    }
  };

  // Confirms the code and unlocks the rest of the form
  const confirmCode = async () => {
    if (otpCode.length !== 6) return;
    setVerifying(true);
    try {
      const res = await verifyEmailOtp(getValues("email"), otpCode);
      setOtpToken(res.data.otpToken);
      toast.success(res.message);
    } catch (err) {
      toast.error(readError(err, "Could not confirm the code"));
    } finally {
      setVerifying(false);
    }
  };

  // Enter key and main button follow whichever step is on screen
  const submitEmailStep = (e) => {
    e.preventDefault();
    if (codeSent) confirmCode();
    else if (cooldown <= 0 && !sending) sendCode();
  };

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
      fd.append("otpToken", otpToken);
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
      // The 30-minute proof ran out — send them back to confirm again
      if (err.response?.data?.emailNotVerified) resetEmailStep();
      toast.error(readError(err, "Registration failed"));
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
      <form
        onSubmit={otpToken ? handleSubmit(onSubmit) : submitEmailStep}
        className="space-y-4"
      >
        {/* Email — step 1, locked once a code is on its way */}
        <div>
          <FieldLabel htmlFor="email">Email address</FieldLabel>
          <div className="relative">
            <Icon name="mail" className="absolute left-5 top-1/2 -translate-y-1/2 text-black/40 pointer-events-none" />
            <input
              {...register("email", {
                required: "Email required",
                pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email" },
              })}
              id="email"
              type="email"
              readOnly={codeSent}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full pl-13 pr-5 py-3.5 font-body text-sm read-only:text-black/60"
            />
          </div>
          {errors.email && (
            <p className="text-danger text-xs mt-1 pl-5">{errors.email.message}</p>
          )}
          {/* Verified state — offer a way back if the email was wrong */}
          {otpToken && (
            <p className="flex items-center gap-1 font-body text-xs text-success mt-1.5 pl-5">
              <Icon name="check_circle" className="text-success" />
              Email verified.
              <button type="button" onClick={resetEmailStep} className="text-black font-bold underline ml-1">
                Change email
              </button>
            </p>
          )}
        </div>
        {/* Step 1 button — send the first code */}
        {!codeSent && (
          <button
            disabled={sending || cooldown > 0}
            className="btn-primary btn-active w-full py-3.5 font-body font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {sending ? <span className="spinner" /> : <Icon name="mail" />}
            {sending ? "Sending..." : cooldown > 0 ? `Send code in ${cooldown}s` : "Send code"}
          </button>
        )}
        {/* Step 2 — type the emailed code */}
        {codeSent && !otpToken && (
          <>
            <div>
              <FieldLabel htmlFor="otpCode">6-digit code</FieldLabel>
              <input
                id="otpCode"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Check your email"
                className="w-full px-5 py-3.5 font-body text-sm"
              />
              <p className="font-body text-xs text-black/60 mt-1.5 pl-5">
                The code expires in 10 minutes. Check your spam folder too.
              </p>
            </div>
            <button
              disabled={verifying || otpCode.length !== 6}
              className="btn-primary btn-active w-full py-3.5 font-body font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {verifying ? <span className="spinner" /> : <Icon name="check_circle" />}
              {verifying ? "Checking..." : "Confirm code"}
            </button>
            {/* Resend waits for the cooldown, change email restarts the step */}
            <div className="flex justify-between font-body text-sm">
              <button
                type="button"
                onClick={sendCode}
                disabled={sending || cooldown > 0}
                className="font-bold underline disabled:opacity-50 disabled:no-underline"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
              <button type="button" onClick={resetEmailStep} className="font-bold underline">
                Change email
              </button>
            </div>
          </>
        )}
        {/* Step 3 — the rest of the form appears after the email is confirmed */}
        {otpToken && (
          <>
        {/* Name */}
        <div>
          <FieldLabel htmlFor="name">Full name</FieldLabel>
          <div className="relative">
            <Icon name="person" className="absolute left-5 top-1/2 -translate-y-1/2 text-black/40 pointer-events-none" />
            <input
              {...register("name", { required: "Name required" })}
              id="name"
              placeholder="As shown on your ID"
              autoComplete="name"
              className="w-full pl-13 pr-5 py-3.5 font-body text-sm"
            />
          </div>
          {errors.name && (
            <p className="text-danger text-xs mt-1 pl-5">{errors.name.message}</p>
          )}
        </div>
        {/* Password */}
        <div>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <div className="relative">
            <Icon name="lock" className="absolute left-5 top-1/2 -translate-y-1/2 text-black/40 pointer-events-none" />
            <input
              {...register("password", {
                required: "Password required",
                minLength: { value: 6, message: "Min 6 chars" },
              })}
              id="password"
              type="password"
              placeholder="At least 6 characters"
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
          <div>
            <FieldLabel>I am a</FieldLabel>
            <Select
              value={role}
              onChange={setRole}
              options={roleOptions}
              ariaLabel="Select role"
            />
          </div>
          <div>
            <FieldLabel>Barangay</FieldLabel>
            <Select
              value={barangayId}
              onChange={setBarangayId}
              options={barangayOptions}
              ariaLabel="Select barangay"
            />
          </div>
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
          </>
        )}
      </form>
    </AuthShell>
  );
};

export default Register;
