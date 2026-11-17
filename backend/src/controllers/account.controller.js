import prisma from "../config/prismaClient.js";
import { uploadToCloudinary } from "../config/cloudinary.js";
import { isEmailProofValid } from "../utils/otp.helper.js";

// ── ACCOUNT SETTINGS: PHOTO, NAME, EMAIL (Yoy, 11-17) ──
// Each one can change once every 7 days, counted separately. The wait
// stops a verified identity from being swapped back and forth.

export const CHANGE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

// Fields the profile pages read after any change
const accountSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  accountStatus: true,
  barangayId: true,
  address: true,
  avatarUrl: true,
  avatarChangedAt: true,
  nameChangedAt: true,
  emailChangedAt: true,
  offersDelivery: true,
  deliveryFee: true,
  storeLat: true,
  storeLng: true,
};

// When the next change is allowed, or null when it is allowed now
const nextAllowed = (changedAt) => {
  if (!changedAt) return null;
  const next = new Date(changedAt.getTime() + CHANGE_COOLDOWN_MS);
  return next > new Date() ? next : null;
};

// Readable wait message, e.g. "You can change your name again on Nov 24, 2026."
const waitMessage = (what, next) =>
  `You can change your ${what} again on ${next.toLocaleDateString("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" })}.`;

// Loads the user's last change dates, the cooldown check needs them
const loadDates = (id) =>
  prisma.user.findUnique({
    where: { id },
    select: { name: true, email: true, avatarChangedAt: true, nameChangedAt: true, emailChangedAt: true },
  });

// ── PROFILE PHOTO ──────────────────────────────────────
// PUT /api/auth/me/avatar — multipart field "avatar", JPG or PNG
export const updateAvatar = async (req, res) => {
  const file = req.file;
  if (!file || !["image/jpeg", "image/jpg", "image/png"].includes(file.mimetype)) {
    return res.status(400).json({ success: false, message: "Choose a JPG or PNG photo" });
  }
  const me = await loadDates(req.user.id);
  const next = nextAllowed(me.avatarChangedAt);
  if (next) return res.status(429).json({ success: false, message: waitMessage("profile photo", next), nextAllowedAt: next });

  const uploaded = await uploadToCloudinary(file.buffer, "avatars");
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { avatarUrl: uploaded.secure_url, avatarChangedAt: new Date() },
    select: accountSelect,
  });
  res.status(200).json({ success: true, message: "Profile photo updated", data: user });
};

// ── NAME ───────────────────────────────────────────────
// PUT /api/auth/me/name { name }
export const updateName = async (req, res) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim().replace(/\s+/g, " ") : "";
  if (name.length < 2 || name.length > 100) {
    return res.status(400).json({ success: false, message: "Name must be between 2 and 100 characters" });
  }
  const me = await loadDates(req.user.id);
  if (name === me.name) return res.status(400).json({ success: false, message: "That is already your name" });
  const next = nextAllowed(me.nameChangedAt);
  if (next) return res.status(429).json({ success: false, message: waitMessage("name", next), nextAllowedAt: next });

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { name, nameChangedAt: new Date() },
    select: accountSelect,
  });
  res.status(200).json({ success: true, message: "Name updated", data: user });
};

// ── EMAIL ──────────────────────────────────────────────
// PUT /api/auth/me/email { email, otpToken }
// The new email must pass the same 6-digit code check as registration
// (POST /auth/otp/send, then /auth/otp/verify), so a typo can never lock
// the user out of their account.
export const updateEmail = async (req, res) => {
  const { email } = req.body;
  const me = await loadDates(req.user.id);
  if (email === me.email) return res.status(400).json({ success: false, message: "That is already your email" });
  const next = nextAllowed(me.emailChangedAt);
  if (next) return res.status(429).json({ success: false, message: waitMessage("email", next), nextAllowedAt: next });
  if (!isEmailProofValid(req.body.otpToken, email)) {
    return res.status(400).json({ success: false, message: "Please verify the new email with the code first" });
  }
  const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (taken) return res.status(400).json({ success: false, message: "That email is already used by another account" });

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { email, emailChangedAt: new Date() },
    select: accountSelect,
  });
  res.status(200).json({ success: true, message: "Email updated. Use it the next time you log in.", data: user });
};
