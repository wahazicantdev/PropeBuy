import crypto from "crypto";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";

// Rules from the feature spec
export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

// 6 digits from a secure random source, never starts with 0
export const generateOtp = () => String(crypto.randomInt(100000, 1000000));

// Keyed hash — a plain hash of 6 digits could be reversed in seconds
export const hashOtp = (email, code) =>
  crypto.createHmac("sha256", JWT_SECRET).update(`${email}:${code}`).digest("hex");

// Constant-time compare so response timing reveals nothing
export const otpMatches = (email, code, storedHash) =>
  crypto.timingSafeEqual(
    Buffer.from(hashOtp(email, code), "hex"),
    Buffer.from(storedHash, "hex"),
  );

// Separate secret so this proof can never work as a login token
const proofSecret = () => `${JWT_SECRET}:email-otp`;

// Short-lived proof that this email passed the code check
export const signEmailProof = (email) =>
  jwt.sign({ email, purpose: "EMAIL_VERIFIED" }, proofSecret(), {
    expiresIn: "30m",
  });

// True only for an unexpired proof issued for this exact email
export const isEmailProofValid = (token, email) => {
  try {
    const decoded = jwt.verify(token, proofSecret());
    return decoded.purpose === "EMAIL_VERIFIED" && decoded.email === email;
  } catch {
    return false;
  }
};
