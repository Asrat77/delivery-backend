import rateLimit from "express-rate-limit";
import { errorResponse } from "../utils/response";

/**
 * Rate limiter for public endpoints (e.g., landing page price calculator).
 * Defaults to 10 requests per minute per IP.
 */
export const publicRateLimiter = (maxPerMinute = 10) =>
  rateLimit({
    windowMs: 60_000,
    max: maxPerMinute,
    standardHeaders: true,
    legacyHeaders: false,
    message: errorResponse(
      "Too many requests. Please try again later.",
      429,
      null
    ),
    keyGenerator: (req) => {
      return req.ip ?? req.socket.remoteAddress ?? "unknown";
    },
  });
