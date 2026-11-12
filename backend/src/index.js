import express from "express";
import cors from "cors";
import "express-async-errors";
import { createServer } from "http";
import { Server } from "socket.io";
import helmet from "helmet";
// Imported config/middleware
import { ALLOWED_ORIGINS, PORT, JWT_SECRET } from "./config/env.js";
// JWT verify — socket handshakes prove identity the same way REST does
import jwt from "jsonwebtoken";
import { errorHandler } from "./middleware/error.middleware.js";
// Rate limiters — shared Wi-Fi rules live in their own file
import {
  generalLimiter,
  loginAccountLimiter,
  loginIpLimiter,
  registerLimiter,
} from "./middleware/rateLimit.middleware.js";
// Prisma client — shutdown handlers disconnect the DB cleanly through this
import prisma from "./config/prismaClient.js";
// Imported Routes
import authRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import orderRoutes from "./routes/order.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import reviewRoutes from "./routes/review.routes.js";

const app = express();

// ── PROXY TRUST ────────────────────────────────────────
// Hosting puts one proxy in front of the app. Without this every visitor
// looks like the proxy's IP and shares one rate limit. Production only,
// so local requests cannot fake their IP with a header.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

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
    origin: ALLOWED_ORIGINS,
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

// ── STANDARD MIDDLEWARE ────────────────────────────────
app.use(
  cors({
    origin: ALLOWED_ORIGINS,
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
app.use("/api/auth/login", loginIpLimiter, loginAccountLimiter);
app.use("/api/auth/register", registerLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reviews", reviewRoutes);

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
