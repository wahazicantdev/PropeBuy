import { useRef, useState } from "react";
import toast from "react-hot-toast";
import FieldLabel from "./FieldLabel.jsx";
import Icon from "./Icon.jsx";
import Spinner from "./Spinner.jsx";
import { useAuthStore } from "../stores/auth.store.js";
import {
  updateAvatar,
  updateName,
  updateEmail,
  requestEmailOtp,
  verifyEmailOtp,
} from "../api/auth.api.js";
import { cld } from "../utils/photos.js";

// 7 days, same as the backend wait between changes
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

// Date the next change opens, or null when it is open now
const nextAllowed = (changedAt) => {
  if (!changedAt) return null;
  const next = new Date(new Date(changedAt).getTime() + COOLDOWN_MS);
  return next > new Date() ? next : null;
};
// "Nov 24, 2026"
const shortDate = (d) => d.toLocaleDateString("en-PH", { dateStyle: "medium" });

// Account settings — profile photo, name and email for buyers and sellers.
// Each can change once every 7 days (Yoy, 11-17). A new email must pass
// the 6-digit code first, so a typo never locks anyone out.
const AccountSettings = () => {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  // Hidden file input behind the photo button
  const fileRef = useRef(null);
  // Name form
  const [name, setName] = useState(user?.name || "");
  // Email form: step "edit" -> "code"
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("edit");
  // Which action is running: avatar | name | send | email
  const [busy, setBusy] = useState(null);

  // Wait dates per field
  const avatarNext = nextAllowed(user?.avatarChangedAt);
  const nameNext = nextAllowed(user?.nameChangedAt);
  const emailNext = nextAllowed(user?.emailChangedAt);

  // Run one call, save the returned user, show the message
  const run = async (key, call) => {
    setBusy(key);
    try {
      const res = await call();
      if (res.data?.id) setUser({ ...useAuthStore.getState().user, ...res.data });
      toast.success(res.message);
      return res;
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save the change");
      return null;
    } finally {
      setBusy(null);
    }
  };

  // Photo picked — upload right away
  const pickPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png"].includes(file.type)) return toast.error("Choose a JPG or PNG photo");
    if (file.size > 5 * 1024 * 1024) return toast.error("Photo must be 5 MB or smaller");
    await run("avatar", () => updateAvatar(file));
  };

  // Save the new name
  const saveName = async (e) => {
    e.preventDefault();
    await run("name", () => updateName(name));
  };

  // Step 1: email the code to the new address
  const sendCode = async (e) => {
    e.preventDefault();
    const res = await run("send", () => requestEmailOtp(email.trim()));
    if (res) setStep("code");
  };

  // Step 2: confirm the code, then switch the email
  const saveEmail = async (e) => {
    e.preventDefault();
    setBusy("email");
    try {
      const proof = await verifyEmailOtp(email.trim(), code.trim());
      const res = await updateEmail(email.trim(), proof.data.otpToken);
      setUser({ ...useAuthStore.getState().user, ...res.data });
      toast.success(res.message);
      setStep("edit");
      setEmail("");
      setCode("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not change your email");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="border border-black/10 rounded-xl p-5 md:p-6 space-y-6">
      <h2 className="heading-body text-lg text-black flex items-center gap-2">
        <Icon name="person" />
        Account settings
      </h2>

      {/* ── Profile photo ── */}
      <div className="flex items-center gap-4">
        <span className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-header text-2xl shrink-0 overflow-hidden">
          {user?.avatarUrl ? (
            <img src={cld(user.avatarUrl, 160)} alt="" className="w-full h-full object-cover" />
          ) : (
            (user?.name || "?").charAt(0).toUpperCase()
          )}
        </span>
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={!!avatarNext || busy !== null}
            className="btn-outline btn-active px-4 py-2 font-body text-sm font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {busy === "avatar" ? <Spinner /> : <Icon name="photo_camera" size={18} />}
            {user?.avatarUrl ? "Change photo" : "Add photo"}
          </button>
          <p className="mt-1 font-body text-xs text-black/60">
            {avatarNext ? `You can change it again on ${shortDate(avatarNext)}.` : "JPG or PNG, up to 5 MB. Once every 7 days."}
          </p>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png" onChange={pickPhoto} className="hidden" />
        </div>
      </div>

      {/* ── Name ── */}
      <form onSubmit={saveName}>
        <FieldLabel htmlFor="acc-name">Name</FieldLabel>
        <div className="flex gap-2">
          <input
            id="acc-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            disabled={!!nameNext}
            className="min-w-0 flex-1 px-5 py-3 font-body text-sm disabled:opacity-60"
          />
          <button
            disabled={!!nameNext || busy !== null || name.trim().length < 2 || name.trim() === user?.name}
            className="btn-primary btn-active px-5 py-3 font-body text-sm font-medium flex items-center gap-2 disabled:opacity-50 shrink-0"
          >
            {busy === "name" && <Spinner />} Save
          </button>
        </div>
        <p className="mt-1 pl-1 font-body text-xs text-black/60">
          {nameNext ? `You can change it again on ${shortDate(nameNext)}.` : "Use the name on your ID. Once every 7 days."}
        </p>
      </form>

      {/* ── Email ── */}
      <form onSubmit={step === "edit" ? sendCode : saveEmail}>
        <FieldLabel htmlFor="acc-email">Email</FieldLabel>
        <p className="font-body text-sm text-black mb-2 break-all">Current: {user?.email}</p>
        {step === "edit" ? (
          <div className="flex gap-2">
            <input
              id="acc-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="New email"
              disabled={!!emailNext}
              className="min-w-0 flex-1 px-5 py-3 font-body text-sm disabled:opacity-60"
            />
            <button
              disabled={!!emailNext || busy !== null || !email.includes("@")}
              className="btn-primary btn-active px-5 py-3 font-body text-sm font-medium flex items-center gap-2 disabled:opacity-50 shrink-0"
            >
              {busy === "send" && <Spinner />} Send code
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                id="acc-email"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6-digit code"
                className="min-w-0 flex-1 px-5 py-3 font-body text-sm tracking-widest"
              />
              <button
                disabled={busy !== null || code.length !== 6}
                className="btn-primary btn-active px-5 py-3 font-body text-sm font-medium flex items-center gap-2 disabled:opacity-50 shrink-0"
              >
                {busy === "email" && <Spinner />} Confirm
              </button>
            </div>
            <p className="mt-1 pl-1 font-body text-xs text-black/60">
              We sent a code to {email}. Check spam too.{" "}
              <button type="button" onClick={() => setStep("edit")} className="font-bold underline">
                Use another email
              </button>
            </p>
          </>
        )}
        {step === "edit" && (
          <p className="mt-1 pl-1 font-body text-xs text-black/60">
            {emailNext ? `You can change it again on ${shortDate(emailNext)}.` : "We email a code to the new address first. Once every 7 days."}
          </p>
        )}
      </form>
    </section>
  );
};

export default AccountSettings;
