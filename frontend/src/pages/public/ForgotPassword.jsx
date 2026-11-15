import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import AuthShell from "../../components/AuthShell.jsx";
import Icon from "../../components/Icon.jsx";
import FieldLabel from "../../components/FieldLabel.jsx";
import PasswordInput from "../../components/PasswordInput.jsx";
import { requestPasswordReset, resetPassword } from "../../api/auth.api.js";

// Forgot password — 1) email a code, 2) code + new password, 3) done
const ForgotPassword = () => {
  const {
    register,
    trigger,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm();
  // Back to the login door they came from
  const [params] = useSearchParams();
  const loginPath = params.get("from") === "seller" ? "/login/seller" : "/login/buyer";
  // 0 = email, 1 = code and new password, 2 = done
  const [step, setStep] = useState(0);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Resend countdown, one second at a time
  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Validator message, then API message, then a fallback
  const readError = (err, fallback) =>
    err.response?.data?.errors?.[0]?.message || err.response?.data?.message || fallback;

  // Step 1 — ask for a code
  const sendCode = async () => {
    if (!(await trigger("email"))) return;
    setBusy(true);
    try {
      const res = await requestPasswordReset(getValues("email"));
      toast.success(res.message);
      setCooldown(res.data.retryAfter);
      setStep(1);
    } catch (err) {
      if (err.response?.data?.retryAfter) {
        setCooldown(err.response.data.retryAfter);
        setStep(1);
      }
      toast.error(readError(err, "Could not send the code"));
    } finally {
      setBusy(false);
    }
  };

  // Step 2 — code plus new password
  const onReset = async (v) => {
    if (code.length !== 6) return toast.error("Enter the 6-digit code");
    setBusy(true);
    try {
      const res = await resetPassword(v.email, code, v.password);
      toast.success(res.message);
      setStep(2);
    } catch (err) {
      toast.error(readError(err, "Could not reset your password"));
    } finally {
      setBusy(false);
    }
  };

  const btn =
    "btn-primary btn-active w-full py-3.5 font-body font-medium flex items-center justify-center gap-2 disabled:opacity-50";

  return (
    <AuthShell
      variant="reset"
      title={step === 2 ? "Password changed" : "Reset password"}
      subtitle={
        step === 0
          ? "Enter the email you signed up with. We'll send you a code."
          : step === 1
            ? "Type the code from your email and choose a new password."
            : "You can log in with your new password now."
      }
      footer={
        <>
          Remembered it?{" "}
          <Link to={loginPath} className="text-black font-bold underline">Log in</Link>
        </>
      }
    >
      {step < 2 ? (
        <form
          onSubmit={step === 0 ? (e) => (e.preventDefault(), sendCode()) : handleSubmit(onReset)}
          className="space-y-4"
        >
          {/* Email — locked after the code is sent */}
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
                readOnly={step === 1}
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full pl-13 pr-5 py-3.5 font-body text-sm read-only:text-black/60"
              />
            </div>
            {errors.email && <p className="text-danger text-xs mt-1 pl-5">{errors.email.message}</p>}
          </div>

          {step === 0 && (
            <button disabled={busy} className={btn}>
              {busy ? <span className="spinner" /> : <Icon name="mail" />}
              {busy ? "Sending..." : "Send code"}
            </button>
          )}

          {step === 1 && (
            <>
              <div>
                <FieldLabel htmlFor="code">6-digit code</FieldLabel>
                <input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Check your email and spam folder"
                  className="w-full px-5 py-3.5 font-body text-sm tracking-[0.3em]"
                />
              </div>
              <div>
                <FieldLabel htmlFor="password">New password</FieldLabel>
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
                <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
                <PasswordInput
                  {...register("confirmPassword", {
                    validate: (x) => x === getValues("password") || "Passwords do not match",
                  })}
                  id="confirmPassword"
                  placeholder="Same password again"
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <p className="text-danger text-xs mt-1 pl-5">{errors.confirmPassword.message}</p>
                )}
              </div>
              <button disabled={busy || code.length !== 6} className={btn}>
                {busy ? <span className="spinner" /> : <Icon name="lock_reset" />}
                {busy ? "Saving..." : "Change password"}
              </button>
              <div className="flex justify-between font-body text-sm">
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={busy || cooldown > 0}
                  className="font-bold underline disabled:opacity-50 disabled:no-underline"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
                <button type="button" onClick={() => setStep(0)} className="font-bold underline">
                  Change email
                </button>
              </div>
            </>
          )}
        </form>
      ) : (
        <Link to={loginPath} className={btn}>
          <Icon name="login" /> Go to log in
        </Link>
      )}
    </AuthShell>
  );
};

export default ForgotPassword;
