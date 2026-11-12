import { config } from "dotenv";

config();

export const {
  PORT,
  DATABASE_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  CLIENT_URL,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  // PayMongo credentials
  PAYMONGO_SECRET_KEY,
  PAYMONGO_PUBLIC_KEY,
  PAYMONGO_WEBHOOK_SECRET,
  // Redirect URLs after payment
  PAYMENT_SUCCESS_URL,
  PAYMENT_FAILED_URL,
  // Email API for registration codes
  BREVO_API_KEY,
  EMAIL_FROM,
} = process.env;

// CLIENT_URL may list several origins: "http://localhost:5173,https://propebuy.vercel.app"
export const ALLOWED_ORIGINS = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
