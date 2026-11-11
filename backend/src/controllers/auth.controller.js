import bcrypt from "bcryptjs";
import { notifyAdminsNewRegistration } from "../utils/notification.helper.js";
import jwt from "jsonwebtoken";
import prisma from "../config/prismaClient.js";
import { uploadToCloudinary } from "../config/cloudinary.js";
import { JWT_SECRET, JWT_EXPIRES_IN } from "../config/env.js";
import {
  extractTextFromImage,
  extractIDFields,
  extractCertificateFields,
  crossCheckDocuments,
} from "../utils/ocr.helper.js";
import { isEmailProofValid } from "../utils/otp.helper.js";

// ── REGISTER ───────────────────────────────────────────
export const register = async (req, res) => {
  const { name, email, password, role, barangayId } = req.body;

  // Validate required fields
  if (!name || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: "Name, email, password, and role are required",
    });
  }

  if (!["BUYER", "SELLER"].includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Role must be either BUYER or SELLER",
    });
  }

  // Email must have passed the code check, before any upload or OCR work
  if (!isEmailProofValid(req.body.otpToken, email)) {
    return res.status(400).json({
      success: false,
      message: "Please verify your email first",
      emailNotVerified: true,
    });
  }

  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "Email already registered",
    });
  }

  // Check if documents were uploaded
  if (!req.files?.idDocument || !req.files?.certDocument) {
    return res.status(400).json({
      success: false,
      message: "Both government ID and Barangay Certificate are required",
    });
  }

  // Get document buffers from multer memory storage
  const idBuffer = req.files.idDocument[0].buffer;
  const certBuffer = req.files.certDocument[0].buffer;

  // ── UPLOAD DOCUMENTS TO CLOUDINARY ────────────────
  // Upload first — we need URLs regardless of OCR result
  const [idUpload, certUpload] = await Promise.all([
    uploadToCloudinary(idBuffer, "documents"),
    uploadToCloudinary(certBuffer, "documents"),
  ]);

  // ── RUN OCR ON BOTH DOCUMENTS ──────────────────────
  // Extract text from both uploaded images simultaneously
  // Promise.all runs both OCR operations at the same time
  // Much faster than running them one after the other
  console.log("Running OCR on uploaded documents...");

  const [idOCR, certOCR] = await Promise.all([
    extractTextFromImage(idBuffer),
    extractTextFromImage(certBuffer),
  ]);

  console.log("ID OCR confidence:", idOCR.confidence);
  console.log("Certificate OCR confidence:", certOCR.confidence);
  console.log("ID extracted text:", idOCR.text.slice(0, 200)); // log first 200 chars

  // ── EXTRACT STRUCTURED FIELDS FROM OCR TEXT ────────
  const idFields = extractIDFields(idOCR.text);
  const certFields = extractCertificateFields(certOCR.text);

  console.log("Extracted ID fields:", idFields);
  console.log("Extracted certificate fields:", certFields);

  // ── CROSS-CHECK DOCUMENTS ──────────────────────────
  // Compare extracted data — determine verification result
  // Use claimed barangay from registration form
  // If no barangayId provided — use empty string
  const barangay = barangayId
    ? await prisma.barangay.findUnique({
        where: { id: parseInt(barangayId) },
        select: { name: true },
      })
    : null;

  const verificationResult = crossCheckDocuments(
    idFields,
    certFields,
    barangay?.name || "",
  );

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // ── CREATE USER WITH OCR RESULTS ──────────────────
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      barangayId: barangayId ? parseInt(barangayId) : null,
      idDocumentUrl: idUpload.secure_url,
      certDocumentUrl: certUpload.secure_url,
      // Every new account waits for an admin, whatever OCR found
      accountStatus: "PENDING",

      // Store OCR results so the admin queue can group this account
      ocrResult: verificationResult.result,
      ocrConfidence: verificationResult.confidence,

      // Store issues as JSON string — Prisma doesn't support arrays
      // Admin portal will parse and display these
      ocrIssues: JSON.stringify(verificationResult.issues),

      // Store extracted data as JSON string for admin reference
      ocrExtractedData: JSON.stringify(verificationResult.extractedData),
    },
  });

  // Admins see the new applicant in their bell
  notifyAdminsNewRegistration(user);

  // ── GENERATE JWT TOKEN ─────────────────────────────
  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  res.status(201).json({
    success: true,
    message:
      "Registration successful. An administrator will review your documents before you can buy or sell.",
    ocrResult: verificationResult.result,
    ocrConfidence: verificationResult.confidence,
    token,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
    },
  });
};

// ── LOGIN ──────────────────────────────────────────────
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(400).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  // ── REJECTED / SUSPENDED — no session at all ──────
  // Checked AFTER the password so the message never confirms which
  // emails exist. PENDING users still log in: sellers need their
  // profile page to see review status, buyers can browse meanwhile.
  if (user.accountStatus === "REJECTED") {
    return res.status(403).json({
      success: false,
      message:
        "This account was rejected or suspended. Contact your barangay administrator.",
    });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountStatus: user.accountStatus,
    },
  });
};

// ── GET CURRENT USER ───────────────────────────────────
export const getMe = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      accountStatus: true,
      barangayId: true,
      address: true,
      offersDelivery: true,
      deliveryFee: true,
      ocrResult: true,
      ocrConfidence: true,
      createdAt: true,
    },
  });

  res.status(200).json({
    success: true,
    data: user,
  });
};

// ── UPDATE MY PROFILE ──────────────────────────────────
// Fields a user may change themselves. Name, email and barangay come
// from the verified documents, so only an admin can change those.
const profileSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  accountStatus: true,
  barangayId: true,
  address: true,
  offersDelivery: true,
  deliveryFee: true,
};

export const updateMe = async (req, res) => {
  // Empty text clears the address
  const address =
    typeof req.body.address === "string" ? req.body.address.trim() : "";
  if (address.length > 300) {
    return res.status(400).json({
      success: false,
      message: "Address must be 300 characters or less",
    });
  }
  const data = { address: address || null };

  // Sellers also set whether they deliver and their flat fee
  if (req.user.role === "SELLER" && req.body.offersDelivery !== undefined) {
    const fee = Number(req.body.deliveryFee ?? 0);
    if (!Number.isFinite(fee) || fee < 0 || fee > 5000) {
      return res.status(400).json({
        success: false,
        message: "Delivery fee must be between ₱0 and ₱5,000",
      });
    }
    data.offersDelivery =
      req.body.offersDelivery === true || req.body.offersDelivery === "true";
    data.deliveryFee = Math.round(fee * 100) / 100;
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data,
    select: profileSelect,
  });

  res.status(200).json({
    success: true,
    message: "Profile saved",
    data: user,
  });
};
