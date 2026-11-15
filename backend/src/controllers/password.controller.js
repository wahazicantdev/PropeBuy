import bcrypt from "bcryptjs";
import prisma from "../config/prismaClient.js";
import { sendOtpEmail } from "../utils/email.helper.js";
import {
  OTP_TTL_MS,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
  generateOtp,
  hashOtp,
  otpMatches,
} from "../utils/otp.helper.js";

// Same answer whether or not the email has an account, so this page
// cannot be used to find out who is registered
const SENT_MESSAGE = "If that email has an account, we sent a 6-digit code to it";

// ── FORGOT PASSWORD: SEND CODE ─────────────────────────
// POST /api/auth/password/forgot { email }
// Uses the same code table as sign-up. There is no overlap: sign-up
// codes go to new emails, reset codes only to registered ones.
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const retryAfter = OTP_RESEND_COOLDOWN_MS / 1000;
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) {
    return res.status(200).json({ success: true, message: SENT_MESSAGE, data: { retryAfter } });
  }

  // Resend cooldown, like sign-up
  const previous = await prisma.emailOtp.findUnique({ where: { email } });
  if (previous) {
    const waitMs = previous.lastSentAt.getTime() + OTP_RESEND_COOLDOWN_MS - Date.now();
    if (waitMs > 0) {
      const wait = Math.ceil(waitMs / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${wait} seconds before requesting another code`,
        retryAfter: wait,
      });
    }
  }

  // Store only the hash; a new code replaces the old one and its attempts
  const code = generateOtp();
  const record = {
    codeHash: hashOtp(email, code),
    attempts: 0,
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
    lastSentAt: new Date(),
  };
  await prisma.emailOtp.upsert({ where: { email }, create: { email, ...record }, update: record });

  try {
    await sendOtpEmail(email, code, "reset");
  } catch (err) {
    console.error("Password reset email failed:", err.message);
    await prisma.emailOtp.deleteMany({ where: { email } });
    return res.status(502).json({ success: false, message: "We could not send the code. Please try again." });
  }
  res.status(200).json({ success: true, message: SENT_MESSAGE, data: { retryAfter } });
};

// ── FORGOT PASSWORD: SET NEW PASSWORD ──────────────────
// POST /api/auth/password/reset { email, code, password }
export const resetPassword = async (req, res) => {
  const { email, code, password } = req.body;

  // Missing and expired codes get the same answer
  const record = await prisma.emailOtp.findUnique({ where: { email } });
  if (!record || record.expiresAt.getTime() < Date.now()) {
    return res.status(400).json({ success: false, message: "This code has expired. Please request a new one." });
  }

  // Count the attempt first and atomically, so parallel guesses cannot pass the limit
  const counted = await prisma.emailOtp.updateMany({
    where: { email, attempts: { lt: OTP_MAX_ATTEMPTS } },
    data: { attempts: { increment: 1 } },
  });
  if (counted.count === 0) {
    return res.status(429).json({ success: false, message: "Too many wrong codes. Please request a new one." });
  }
  if (!otpMatches(email, code, record.codeHash)) {
    return res.status(400).json({ success: false, message: "Incorrect code. Please try again." });
  }

  // Code is good: save the new password and use the code up
  const hashed = await bcrypt.hash(password, 10);
  const updated = await prisma.user.updateMany({ where: { email }, data: { password: hashed } });
  await prisma.emailOtp.deleteMany({ where: { email } });
  if (!updated.count) {
    return res.status(400).json({ success: false, message: "This code has expired. Please request a new one." });
  }
  res.status(200).json({ success: true, message: "Password changed. You can log in now.", data: null });
};
