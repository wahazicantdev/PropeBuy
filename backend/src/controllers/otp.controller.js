import prisma from "../config/prismaClient.js";
import { sendOtpEmail } from "../utils/email.helper.js";
import {
  OTP_TTL_MS,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
  generateOtp,
  hashOtp,
  otpMatches,
  signEmailProof,
} from "../utils/otp.helper.js";

// ── SEND CODE ──────────────────────────────────────────
export const sendOtp = async (req, res) => {
  const { email } = req.body;

  // Registered emails cannot start another signup
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "Email already registered",
    });
  }

  // Resend cooldown — also tells the page how long to wait
  const previous = await prisma.emailOtp.findUnique({ where: { email } });
  if (previous) {
    const waitMs =
      previous.lastSentAt.getTime() + OTP_RESEND_COOLDOWN_MS - Date.now();
    if (waitMs > 0) {
      const retryAfter = Math.ceil(waitMs / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${retryAfter} seconds before requesting another code`,
        retryAfter,
      });
    }
  }

  // Store only the hash. A new code replaces the old one and its attempts.
  const code = generateOtp();
  const record = {
    codeHash: hashOtp(email, code),
    attempts: 0,
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
    lastSentAt: new Date(),
  };
  await prisma.emailOtp.upsert({
    where: { email },
    create: { email, ...record },
    update: record,
  });

  // A failed send clears the record so the cooldown does not block a retry
  try {
    await sendOtpEmail(email, code);
  } catch (err) {
    console.error("Email OTP failed to send:", err.message);
    await prisma.emailOtp.deleteMany({ where: { email } });
    return res.status(502).json({
      success: false,
      message: "We could not send the code. Please try again.",
    });
  }

  res.status(200).json({
    success: true,
    message: "We sent a 6-digit code to your email",
    data: { retryAfter: OTP_RESEND_COOLDOWN_MS / 1000 },
  });
};

// ── CONFIRM CODE ───────────────────────────────────────
export const verifyOtp = async (req, res) => {
  const { email, code } = req.body;

  // Missing and expired codes get the same answer
  const record = await prisma.emailOtp.findUnique({ where: { email } });
  if (!record || record.expiresAt.getTime() < Date.now()) {
    return res.status(400).json({
      success: false,
      message: "This code has expired. Please request a new one.",
    });
  }

  // Count the attempt first and atomically, so parallel guesses cannot
  // slip past the limit
  const counted = await prisma.emailOtp.updateMany({
    where: { email, attempts: { lt: OTP_MAX_ATTEMPTS } },
    data: { attempts: { increment: 1 } },
  });
  if (counted.count === 0) {
    return res.status(429).json({
      success: false,
      message: "Too many wrong codes. Please request a new one.",
    });
  }

  // Wrong code — attempts already counted above
  if (!otpMatches(email, code, record.codeHash)) {
    return res.status(400).json({
      success: false,
      message: "Incorrect code. Please try again.",
    });
  }

  // One-time use — remove it and hand back the proof for registration
  await prisma.emailOtp.deleteMany({ where: { email } });
  res.status(200).json({
    success: true,
    message: "Email verified",
    data: { otpToken: signEmailProof(email) },
  });
};
