import { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 5 * 60 * 1000; // 5 minutes window
const MAX_REQUESTS = 30; // Max 30 attempts per 5 minutes for auth endpoints

const ipStore = new Map<string, RateLimitRecord>();

// Clean up stale entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipStore.entries()) {
    if (now > record.resetAt) {
      ipStore.delete(ip);
    }
  }
}, 10 * 60 * 1000);

export function authRateLimiter(req: Request, res: Response, next: NextFunction): void {
  // Skip rate limiting during test runs
  if (process.env.NODE_ENV === "test") {
    next();
    return;
  }

  const clientIp = req.ip || req.headers["x-forwarded-for"]?.toString() || "unknown";
  const now = Date.now();
  const record = ipStore.get(clientIp);

  if (!record || now > record.resetAt) {
    ipStore.set(clientIp, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    next();
    return;
  }

  record.count++;

  if (record.count > MAX_REQUESTS) {
    const retryAfterSeconds = Math.ceil((record.resetAt - now) / 1000);
    res.set("Retry-After", String(retryAfterSeconds));
    res.status(429).json({
      success: false,
      error: "Too many authentication attempts. Please try again in a few minutes.",
    });
    return;
  }

  next();
}
