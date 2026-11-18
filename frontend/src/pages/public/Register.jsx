import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import AuthShell from "../../components/AuthShell.jsx";
import Icon from "../../components/Icon.jsx";
import FieldLabel from "../../components/FieldLabel.jsx";
import PasswordInput from "../../components/PasswordInput.jsx";
import Select from "../../components/Select.jsx";
import Stepper from "../../components/Stepper.jsx";
import {
  registerUser,
  requestEmailOtp,
  verifyEmailOtp,
} from "../../api/auth.api.js";
import { fetchBarangays } from "../../api/product.api.js";
import { useAuthStore } from "../../stores/auth.store.js";

// The 4 registration steps
const STEPS = ["Account", "Email", "Details", "Documents"];

// Account type cards for step 1
const ROLES = [
  { value: "BUYER", icon: "shopping_bag", title: "Buyer", text: "Shop from verified sellers in your barangay." },
  { value: "SELLER", icon: "storefront", title: "Seller", text: "Open a free online store for your shop." },
];

// Register — 4 steps: account type, email code, details, documents
const Register = () => {
  // Text fields via hook-form, dropdowns via state for the custom Select
  const {
    register,
    trigger,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm();
  // Which step is on screen
  const [step, setStep] = useState(0);
  // Role and barangay held in state since they are not text inputs
  const [role, setRole] = useState("BUYER");
  const [barangayId, setBarangayId] = useState("");
  // Files via state (File objects)
  const [idDoc, setIdDoc] = useState(null);
  const [certDoc, setCertDoc] = useState(null);
  // Consent to the Terms and Privacy Policy
  const [agreed, setAgreed] = useState(false);
  // Dropdown options
  const [barangays, setBarangays] = useState([]);
  // Block double submit
  const [loading, setLoading] = useState(false);
  // Email code — otpToken is the proof sent with registration
  const [codeSent, setCodeSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpToken, setOtpToken] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  // Store plus nav
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

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

  // Back to the start of the email step so a different email can be used
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

  // Confirms the code, then moves on to the details step
  const confirmCode = async () => {
    if (otpCode.length !== 6) return;
    setVerifying(true);
    try {
      const res = await verifyEmailOtp(getValues("email"), otpCode);
      setOtpToken(res.data.otpToken);
      toast.success(res.message);
      setStep(2);
    } catch (err) {
      toast.error(readError(err, "Could not confirm the code"));
    } finally {
      setVerifying(false);
    }
  };

  // Details step — name, matching passwords and barangay
  const finishDetails = async () => {
    if (!(await trigger(["name", "password", "confirmPassword"]))) return;
    if (!barangayId) return toast.error("Please select your barangay");
    setStep(3);
  };

  // Final submit — FormData for the 2 document files
  const onSubmit = async (values) => {
    if (!idDoc || !certDoc) return toast.error("Upload both your ID and Barangay Certificate");
    if (!agreed) return toast.error("Please agree to the Terms of Use and Privacy Policy");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("name", values.name);
      fd.append("email", values.email);
      fd.append("password", values.password);
      fd.append("role", role);
      fd.append("barangayId", barangayId);
      fd.append("otpToken", otpToken);
      fd.append("acceptTerms", "true");
      fd.append("idDocument", idDoc);
      fd.append("certDocument", certDoc);
      // POST /auth/register
      const res = await registerUser(fd);
      login(res.data, res.token);
      toast.success(res.message);
      // Sellers land on their profile while waiting for approval
      if (res.data.role === "SELLER")
        navigate(res.data.accountStatus === "VERIFIED" ? "/seller/dashboard" : "/seller/profile");
      else navigate("/browse");
    } catch (err) {
      // The 30-minute email proof ran out — confirm the email again
      if (err.response?.data?.emailNotVerified) {
        resetEmailStep();
        setStep(1);
      }
      // No answer in time — the server may still have saved the account
      if (err.code === "ECONNABORTED" || !err.response) {
        toast.error(
          "This took too long. Your account may already be created, so try logging in before registering again.",
          { duration: 8000 },
        );
      } else {
        toast.error(readError(err, "Registration failed"));
      }
    } finally {
      setLoading(false);
    }
  };

  // Enter key follows whichever step is on screen
  const onFormSubmit = (e) => {
    if (step === 3) return handleSubmit(onSubmit)(e);
    e.preventDefault();
    if (step === 0) setStep(1);
    else if (step === 1) {
      if (otpToken) setStep(2);
      else if (codeSent) confirmCode();
      else if (cooldown <= 0 && !sending) sendCode();
    } else if (step === 2) finishDetails();
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
        <span className="block font-body text-xs text-black/60 truncate">{file ? file.name : hint}</span>
      </span>
      <Icon name="upload_file" className="ml-auto text-black/40" />
      <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
    </label>
  );

  // Shared button styles
  const primaryBtn =
    "btn-primary btn-active w-full py-3.5 font-body font-medium flex items-center justify-center gap-2 disabled:opacity-50";
  const backBtn = (to) => (
    <button
      type="button"
      onClick={() => setStep(to)}
      className="btn-outline btn-active px-5 py-3.5 font-body font-medium flex items-center gap-1 shrink-0"
    >
      <Icon name="arrow_back" size={18} /> Back
    </button>
  );

  return (
    <AuthShell
      variant="register"
      title="Create account"
      subtitle="Four quick steps. Buyers and sellers both verify with a government ID and a Barangay Certificate."
      footer={
        <>
          Have an account?{" "}
          <Link to="/login/buyer" className="text-black font-bold underline">
            Log in
          </Link>
        </>
      }
    >
      <div className="mb-8">
        <Stepper steps={STEPS} current={step} onJump={(i) => setStep(i)} />
      </div>
      <form onSubmit={onFormSubmit} className="space-y-4">
        {/* ── STEP 1: buyer or seller ── */}
        {step === 0 && (
          <>
            <p className="font-body text-sm font-bold">How will you use PropeBuy?</p>
            <div className="grid gap-3">
              {ROLES.map((r) => (
                <button
                  type="button"
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  aria-pressed={role === r.value}
                  className={`flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-colors ${role === r.value ? "border-black bg-black/[0.03]" : "border-black/10 hover:border-black/30"}`}
                >
                  <span className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${role === r.value ? "bg-black text-white" : "bg-surface"}`}>
                    <Icon name={r.icon} size={24} />
                  </span>
                  <span className="min-w-0">
                    <span className="block font-body font-bold text-base">{r.title}</span>
                    <span className="block font-body text-sm text-black/60">{r.text}</span>
                  </span>
                  {role === r.value && <Icon name="check_circle" className="ml-auto" />}
                </button>
              ))}
            </div>
            <button className={primaryBtn}>
              Continue as {role === "SELLER" ? "seller" : "buyer"} <Icon name="arrow_forward" size={18} />
            </button>
          </>
        )}

        {/* ── STEP 2: email and 6-digit code ── */}
        {step === 1 && (
          <>
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
              {errors.email && <p className="text-danger text-xs mt-1 pl-5">{errors.email.message}</p>}
              {otpToken && (
                <p className="flex items-center gap-1 font-body text-xs text-success mt-1.5 pl-5">
                  <Icon name="check_circle" className="text-success" /> Email verified.
                  <button type="button" onClick={resetEmailStep} className="text-black font-bold underline ml-1">
                    Change email
                  </button>
                </p>
              )}
            </div>
            {/* Code box appears once a code is on its way */}
            {codeSent && !otpToken && (
              <div>
                <FieldLabel htmlFor="otpCode">6-digit code</FieldLabel>
                <input
                  id="otpCode"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Check your email"
                  className="w-full px-5 py-3.5 font-body text-sm tracking-[0.3em]"
                />
                <p className="font-body text-xs text-black/60 mt-1.5 pl-5">
                  The code expires in 10 minutes. Check your spam folder too.
                </p>
              </div>
            )}
            <div className="flex gap-3">
              {backBtn(0)}
              {otpToken ? (
                <button className={primaryBtn}>
                  Next <Icon name="arrow_forward" size={18} />
                </button>
              ) : !codeSent ? (
                <button disabled={sending || cooldown > 0} className={primaryBtn}>
                  {sending ? <span className="spinner" /> : <Icon name="mail" />}
                  {sending ? "Sending..." : cooldown > 0 ? `Send code in ${cooldown}s` : "Send code"}
                </button>
              ) : (
                <button disabled={verifying || otpCode.length !== 6} className={primaryBtn}>
                  {verifying ? <span className="spinner" /> : <Icon name="check_circle" />}
                  {verifying ? "Checking..." : "Confirm code"}
                </button>
              )}
            </div>
            {/* Resend waits for the cooldown; change email restarts the step */}
            {codeSent && !otpToken && (
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
            )}
          </>
        )}

        {/* ── STEP 3: name, password, barangay ── */}
        {step === 2 && (
          <>
            <div>
              <FieldLabel htmlFor="name">Full name</FieldLabel>
              <div className="relative">
                <Icon name="person" className="absolute left-5 top-1/2 -translate-y-1/2 text-black/40 pointer-events-none" />
                <input
                  {...register("name", {
                    required: "Name required",
                    minLength: { value: 2, message: "At least 2 characters" },
                  })}
                  id="name"
                  placeholder="As shown on your ID"
                  autoComplete="name"
                  className="w-full pl-13 pr-5 py-3.5 font-body text-sm"
                />
              </div>
              {errors.name && <p className="text-danger text-xs mt-1 pl-5">{errors.name.message}</p>}
              {/* The ID and certificate check compares this exact name */}
              <p className="font-body text-xs text-black/60 mt-1 pl-5">
                Must match the name on your ID and certificate. Sellers pick a public store name after verification.
              </p>
            </div>
            <div>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <PasswordInput
                {...register("password", {
                  required: "Password required",
                  minLength: { value: 6, message: "Min 6 chars" },
                })}
                id="password"
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
              {errors.password && <p className="text-danger text-xs mt-1 pl-5">{errors.password.message}</p>}
            </div>
            <div>
              <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
              <PasswordInput
                {...register("confirmPassword", {
                  required: "Type your password again",
                  validate: (v) => v === getValues("password") || "Passwords do not match",
                })}
                id="confirmPassword"
                placeholder="Same password again"
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <p className="text-danger text-xs mt-1 pl-5">{errors.confirmPassword.message}</p>
              )}
            </div>
            <div>
              <FieldLabel>Barangay</FieldLabel>
              <Select value={barangayId} onChange={setBarangayId} options={barangayOptions} ariaLabel="Select barangay" />
            </div>
            <div className="flex gap-3">
              {backBtn(1)}
              <button className={primaryBtn}>
                Next <Icon name="arrow_forward" size={18} />
              </button>
            </div>
          </>
        )}

        {/* ── STEP 4: documents and consent ── */}
        {step === 3 && (
          <>
            <div className="grid gap-3">
              {docTile("Government ID", "Any valid government-issued ID, photo", "id_card", idDoc, setIdDoc)}
              {docTile("Barangay Certificate", "Certificate of Residency, issued within 6 months", "description", certDoc, setCertDoc)}
            </div>
            <p className="font-body text-xs text-black/60 flex items-start gap-2">
              <Icon name="info" size={16} className="mt-px" />
              An administrator checks your documents before you can check out or sell.
            </p>
            {/* Consent — required by the Data Privacy Act */}
            <label className="flex items-start gap-3 font-body text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 shrink-0 accent-black"
              />
              <span>
                I agree to the{" "}
                <Link to="/terms" target="_blank" className="font-bold underline">Terms of Use</Link> and{" "}
                <Link to="/privacy" target="_blank" className="font-bold underline">Privacy Policy</Link>, and I allow
                PropeBuy to process my ID and certificate for verification.
              </span>
            </label>
            <div className="flex gap-3">
              {backBtn(2)}
              <button disabled={loading} className={primaryBtn}>
                {loading ? <span className="spinner" /> : <Icon name="how_to_reg" />}
                {loading ? "Checking your documents (up to 1 minute)..." : "Create account"}
              </button>
            </div>
          </>
        )}
      </form>
    </AuthShell>
  );
};

export default Register;
