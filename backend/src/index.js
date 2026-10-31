import express from "express";
import cors from "cors";
import "express-async-errors";
import { createServer } from "http";
import { Server } from "socket.io";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
// Imported config/middleware
import { CLIENT_URL, PORT, JWT_SECRET } from "./config/env.js";
// JWT verify — socket handshakes prove identity the same way REST does
import jwt from "jsonwebtoken";
import { errorHandler } from "./middleware/error.middleware.js";
// Prisma client — shutdown handlers disconnect the DB cleanly through this
import prisma from "./config/prismaClient.js";
// Imported Routes
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import orderRoutes from "./routes/order.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const app = express();

// ── CREATE HTTP SERVER ─────────────────────────────────
// We wrap Express in a raw HTTP server
// because Socket.io needs direct access to the HTTP server
// not just the Express app
const httpServer = createServer(app);

// ── INITIALIZE SOCKET.IO ───────────────────────────────
// Attach Socket.io to the HTTP server
// cors config allows our React frontend to connect
export const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ── SOCKET.IO HANDSHAKE AUTH ───────────────────────────
// Every socket must present the same JWT the REST API uses.
// Before this, clients did socket.emit("join", anyId) — anyone could
// join user_5 and read user 5's order and payment notifications.
// Now the room comes from the VERIFIED token, never from the client.
io.use((socket, next) => {
  // Token rides in the handshake auth payload from socket.io-client
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Not authorized — no token"));
  try {
    // Same secret as the protect middleware — one identity system
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch {
    // Expired or tampered token — refuse the connection
    next(new Error("Not authorized — invalid token"));
  }
});

// ── SOCKET.IO CONNECTION HANDLER ───────────────────────
// Runs every time a client connects to the socket server
io.on("connection", (socket) => {
  // ── JOIN PERSONAL ROOM ───────────────────────────
  // Room named after the verified user ID — notification helpers emit
  // to user_{id}, so only that user's sockets receive their events.
  // Joined server-side on connect, so reconnects rejoin automatically.
  socket.join(`user_${socket.userId}`);
  console.log(`Socket ${socket.id} joined room user_${socket.userId}`);

  // ── DISCONNECT HANDLER ───────────────────────────
  // Fires when client disconnects — browser closed, tab closed, etc.
  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// ── SECURITY MIDDLEWARE ────────────────────────────────

// Helmet — sets secure HTTP headers on every response
// Protects against XSS, clickjacking, MIME sniffing attacks
// Must be one of the first middleware — applies to all routes
app.use(helmet());

// ── RATE LIMITERS ──────────────────────────────────────

// General rate limiter — applies to all API routes
// Allows 1000 requests per 15 minutes per IP address (~1 per second
// sustained). 100 was too tight once orders started refetching live on
// socket events — a normal shopping session plus React StrictMode in dev
// could hit it. 1000 still stops scraping and request floods.
// Prevents general API abuse and scraping
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  max: 1000, // max requests per window per IP
  // Never throttle:
  // - the PayMongo webhook: retries come from PayMongo's shared IPs, and
  //   a 429 there means a paid order never gets its confirmation
  // - CORS preflights: the browser sends one before many real requests,
  //   counting them would charge every frontend call twice
  skip: (req) =>
    req.method === "OPTIONS" ||
    req.originalUrl.startsWith("/api/orders/webhook/paymongo"),
  message: {
    success: false,
    message: "Too many requests — please try again after 15 minutes",
  },
  // standardHeaders — returns rate limit info in response headers
  // X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
  standardHeaders: true,
  // legacyHeaders — disables old X-RateLimit headers
  legacyHeaders: false,
});

// Auth rate limiter — stricter limit for login and register
// Allows only 10 FAILED attempts per 15 minutes per IP address
// Prevents brute-force password attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // only 10 failed auth attempts per window
  // Count failures only (status >= 400). A guesser still hits the wall
  // after 10 wrong passwords, but switching between real accounts —
  // buyer, seller, admin during a demo — never burns the budget.
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message:
      "Too many authentication attempts — please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── STANDARD MIDDLEWARE ────────────────────────────────
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);
// Parse JSON bodies for incoming requests, Example: { "task": "Buy groceries" }, and make it available in req.body
app.use(
  express.json({
    // Keep the exact request bytes for the PayMongo webhook only —
    // signature verification hashes the raw body, and re-stringified
    // JSON can differ by a single space and fail every check
    verify: (req, res, buf) => {
      if (req.originalUrl.startsWith("/api/orders/webhook/paymongo")) {
        req.rawBody = buf.toString("utf8");
      }
    },
  }),
);
app.use(express.urlencoded({ extended: true }));

// ── ROUTES ─────────────────────────────────────────────
// General limiter — every API route. Defined since the backend phase but
// never mounted until now, so the API had no request cap at all.
app.use("/api", generalLimiter);

// Brute-force guard only where credentials and documents are submitted.
// It used to wrap the whole /api/auth router, so GET /auth/me (called by
// Browse, Checkout and both profile pages, twice per visit under React
// StrictMode in dev) spent the same 10-request budget and locked users
// out of logging in without a single wrong password.
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);

// Health check route
app.get("/", (req, res) => {
  res.json({
    message: "PropeBuy API is running!",
    status: "OK",
  });
});

// Error handler — must be last
app.use(errorHandler);

// ── START SERVER ───────────────────────────────────────
// Use httpServer.listen instead of app.listen
// because Socket.io is attached to httpServer — not app
const server = httpServer.listen(PORT, () => {
  console.log(`PropeBuy backend running on port http://localhost:${PORT}`);
});

// ── PROCESS EVENT HANDLERS ─────────────────────────────
// These handle unexpected errors and graceful shutdown
// Without these — server can crash without proper cleanup

// Catches Promise rejections that were never handled
// Example: async function threw but had no try-catch
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);

  // Close server gracefully — stop accepting new requests
  // Then disconnect from database — then exit
  server.close(async () => {
    await prisma.$disconnect();
    console.log("Database disconnected after unhandled rejection");
    process.exit(1); // Exit with error code 1
  });
});

// Catches synchronous errors that bubble up to the top
// Example: programming bugs that throw unexpectedly
process.on("uncaughtException", async (err) => {
  console.error("Uncaught Exception:", err);

  // Disconnect from database before exiting
  await prisma.$disconnect();
  console.log("Database disconnected after uncaught exception");
  process.exit(1); // Exit with error code 1
});

// Handles graceful shutdown signal
// Sent by: Ctrl+C, deployment restart, Docker stop
// Gives server time to finish current requests before stopping
process.on("SIGTERM", async () => {
  console.log("SIGTERM received — shutting down gracefully");

  server.close(async () => {
    // Disconnect from database cleanly
    await prisma.$disconnect();
    console.log("Database disconnected — server shut down cleanly");
    process.exit(0); // Exit with success code 0
  });
});

export default app;
