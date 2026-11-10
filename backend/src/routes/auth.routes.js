import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login, getMe } from "../controllers/auth.controller.js";
import { sendOtp, verifyOtp } from "../controllers/otp.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { upload } from "../config/cloudinary.js";
import {
  validateRegister,
  validateLogin,
  validateOtpSend,
  validateOtpVerify,
} from "../middleware/validate.middleware.js";

const authRoutes = Router();

// Per-network caps on top of the per-email cooldown and attempt limits
const otpLimiterOptions = {
  windowMs: 15 * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many code requests — please try again after 15 minutes",
  },
};
const otpSendLimiter = rateLimit({ ...otpLimiterOptions, max: 20 });
const otpVerifyLimiter = rateLimit({ ...otpLimiterOptions, max: 60 });

// Public routes — no token needed
// uploadDocuments.fields() tells multer to expect
// two file fields — idDocument and certDocument
authRoutes.post(
  "/register",
  upload.fields([
    { name: "idDocument", maxCount: 1 },
    { name: "certDocument", maxCount: 1 },
  ]),
  validateRegister,
  register,
);

authRoutes.post("/login", validateLogin, login);

// Email code — must pass before registration is accepted
authRoutes.post("/otp/send", otpSendLimiter, validateOtpSend, sendOtp);
authRoutes.post("/otp/verify", otpVerifyLimiter, validateOtpVerify, verifyOtp);

// Protected route — token required
authRoutes.get("/me", protect, getMe);

export default authRoutes;
