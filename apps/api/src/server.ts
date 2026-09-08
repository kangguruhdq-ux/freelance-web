import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

const initialEnv = process.env.NODE_ENV;
dotenv.config();
if (initialEnv) {
  process.env.NODE_ENV = initialEnv;
}

import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import adminRoutes from "./routes/admin.routes";
import jobRoutes from "./routes/jobs.routes";
import proposalRoutes from "./routes/proposals.routes";
import profileRoutes from "./routes/profiles.routes";
import contractRoutes from "./routes/contracts.routes";
import milestoneRoutes from "./routes/milestones.routes";
import messageRoutes from "./routes/messages.routes";
import paymentRoutes from "./routes/payments.routes";
import reviewRoutes from "./routes/reviews.routes";
import disputeRoutes from "./routes/disputes.routes";
import reportRoutes from "./routes/reports.routes";
import notificationRoutes from "./routes/notifications.routes";

import { authRateLimiter } from "./middleware/rate-limit.middleware";

export const app = express();
const PORT = process.env.API_PORT || 4000;

// Security Headers Middleware
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// CORS & Middleware
app.use(
  cors({
    origin: [
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(cookieParser());

// Public Health Check
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "FreelanceHub API",
    timestamp: new Date().toISOString(),
  });
});

// Mounted Routes
app.use("/auth", authRateLimiter, authRoutes);

app.use("/users", userRoutes);
app.use("/admin", adminRoutes);
app.use("/jobs", jobRoutes);
app.use("/proposals", proposalRoutes);
app.use("/profiles", profileRoutes);
app.use("/contracts", contractRoutes);
app.use("/contracts", messageRoutes);
app.use("/milestones", milestoneRoutes);
app.use("/payments", paymentRoutes);
app.use("/reports", reportRoutes);
app.use("/notifications", notificationRoutes);
app.use("/", reviewRoutes);
app.use("/", disputeRoutes);





// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled API Error:", err);
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === "production" ? "Internal server error" : err.message || "Internal server error",
  });
});

// Start listener only when executed directly
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`🚀 FreelanceHub API listening on http://localhost:${PORT}`);
  });
}

export default app;
