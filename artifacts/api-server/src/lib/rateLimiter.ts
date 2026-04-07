// Generic limiter for sensitive endpoints (reset password, admin seed, etc)
export const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: "Too many attempts, please try again in 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});
import rateLimit from "express-rate-limit";

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: "Too many login attempts, please try again in 15 minutes",
  standardHeaders: true, // Include rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === "/api/healthz";
  },
});

export const pinLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: "Too many PIN login attempts, please try again in 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by email + IP for better security
    return `${req.body?.email || "unknown"}:${req.ip}`;
  },
});
