import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";

const FIFTEEN_MINUTES = 15 * 60 * 1000;

// Shared IP key — handles IPv6 ranges so one device cannot rotate addresses
const ipKey = (req) => ipKeyGenerator(req.ip);

// Logged-in users get their own budget, so a room on one Wi-Fi does not
// share 1000 requests. The token is verified, so a made-up one cannot
// create a fresh budget and falls back to the IP.
const userOrIpKey = (req) => {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const { id } = jwt.verify(header.split(" ")[1], JWT_SECRET);
      if (id) return `user:${id}`;
    } catch {
      // Expired or fake token — count it against the IP below
    }
  }
  return `ip:${ipKey(req)}`;
};

// Same response format and headers for every limiter
const limiterDefaults = {
  windowMs: FIFTEEN_MINUTES,
  standardHeaders: true,
  legacyHeaders: false,
};

// General limiter — 1000 requests per user or per anonymous IP
export const generalLimiter = rateLimit({
  ...limiterDefaults,
  max: 1000,
  keyGenerator: userOrIpKey,
  // Never throttle PayMongo retries or CORS preflights
  skip: (req) =>
    req.method === "OPTIONS" ||
    req.originalUrl.startsWith("/api/orders/webhook/paymongo"),
  message: {
    success: false,
    message: "Too many requests — please try again after 15 minutes",
  },
});

// Failed-only auth limiter message, shared by the three limiters below
const authLimiterOptions = {
  ...limiterDefaults,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message:
      "Too many authentication attempts — please try again after 15 minutes",
  },
};

// Login per account and IP — wrong passwords only lock that one account
// on that network, not everyone else in the room
export const loginAccountLimiter = rateLimit({
  ...authLimiterOptions,
  max: 10,
  keyGenerator: (req) =>
    `${ipKey(req)}:${String(req.body?.email || "").trim().toLowerCase()}`,
});

// Login per IP — stops one device from guessing across many accounts
export const loginIpLimiter = rateLimit({
  ...authLimiterOptions,
  max: 100,
  keyGenerator: ipKey,
});

// Register per IP — the multipart body is not parsed yet at this point
export const registerLimiter = rateLimit({
  ...authLimiterOptions,
  max: 10,
  keyGenerator: ipKey,
});
