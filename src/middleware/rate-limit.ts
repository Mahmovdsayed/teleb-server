import type { Context, MiddlewareHandler } from "hono";
import redis from "../helpers/redis";

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
  statusCode?: number;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
  keyGenerator?: (c: Context) => string;
}

function extractIp(c: Context): string {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return c.req.header("x-real-ip") ?? "unknown";
}

export const rateLimiter = (options: RateLimitOptions): MiddlewareHandler => {
  const {
    windowMs,
    max,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    message = "Too many requests, please try again later.",
    statusCode = 429,
    standardHeaders = true,
    legacyHeaders = false,
    keyGenerator,
  } = options;

  return async (c, next) => {
    if (!redis || redis.status !== "ready") return next();
    const bypassKey = Bun.env.LOAD_TEST_BYPASS_KEY;

    if (
      bypassKey &&
      Bun.env.NODE_ENV !== "production" &&
      c.req.header("X-Load-Test") === bypassKey
    ) {
      return next();
    }

    const ip = extractIp(c);
    const identifier = keyGenerator
      ? keyGenerator(c)
      : `${c.req.method}:${c.req.path}:${ip}:ua:${c.req.header("user-agent") ?? "unknown"}`;

    const key = `teleb:rate-limit:${identifier}`;

    try {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.pexpire(key, windowMs);
      }

      const ttl = await redis.pttl(key);
      const retryAfter = Math.max(1, Math.ceil(ttl / 1000));
      const resetTime = Math.ceil((Date.now() + ttl) / 1000);

      if (count > max) {
        setRateLimitHeaders(c, {
          max,
          remaining: 0,
          resetTime,
          standardHeaders,
          legacyHeaders,
          retryAfter,
        });

        return c.json(
          {
            success: false,
            message,
            retryAfter,
          },
          statusCode as 429,
        );
      }

      setRateLimitHeaders(c, {
        max,
        remaining: Math.max(0, max - count),
        resetTime,
        standardHeaders,
        legacyHeaders,
      });
      await next();
      const responseOk = c.res.ok;

      const shouldDecrement =
        (skipSuccessfulRequests && responseOk) ||
        (skipFailedRequests && !responseOk);

      if (shouldDecrement) {
        await redis.decr(key);
      }
    } catch (error) {
      console.error("Rate limiter Redis error:", error);
      return next();
    }
  };
};

function setRateLimitHeaders(
  c: Context,
  options: {
    max: number;
    remaining: number;
    resetTime: number;
    standardHeaders: boolean;
    legacyHeaders: boolean;
    retryAfter?: number;
  },
) {
  const {
    max,
    remaining,
    resetTime,
    standardHeaders,
    legacyHeaders,
    retryAfter,
  } = options;

  if (standardHeaders) {
    c.header("RateLimit-Limit", String(max));
    c.header("RateLimit-Remaining", String(remaining));
    c.header("RateLimit-Reset", String(resetTime));
  }

  if (legacyHeaders) {
    c.header("X-RateLimit-Limit", String(max));
    c.header("X-RateLimit-Remaining", String(remaining));
    c.header("X-RateLimit-Reset", String(resetTime));
  }

  if (retryAfter !== undefined) {
    c.header("Retry-After", String(retryAfter));
  }
}

export const globalRateLimiter = (
  options?: Partial<RateLimitOptions>,
): MiddlewareHandler =>
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    keyGenerator: (c) =>
      `global:${extractIp(c)}:ua:${c.req.header("user-agent") ?? "unknown"}`,
    ...options,
  });

export const authRateLimiter = (
  options?: Partial<RateLimitOptions>,
): MiddlewareHandler =>
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: true,
    message: "Too many login attempts, please try again later.",
    standardHeaders: true,
    keyGenerator: (c) =>
      `auth:${extractIp(c)}:ua:${c.req.header("user-agent") ?? "unknown"}`,
    ...options,
  });

export const strictRateLimiter = (
  options?: Partial<RateLimitOptions>,
): MiddlewareHandler =>
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many attempts, please try again later.",
    standardHeaders: true,
    keyGenerator: (c) =>
      `strict:${extractIp(c)}:ua:${c.req.header("user-agent") ?? "unknown"}`,
    ...options,
  });

export const adminRateLimiter = (
  options?: Partial<RateLimitOptions>,
): MiddlewareHandler =>
  rateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 50,
    message: "Too many requests, please try again later.",
    standardHeaders: true,
    keyGenerator: (c) =>
      `admin:${extractIp(c)}:ua:${c.req.header("user-agent") ?? "unknown"}`,
    ...options,
  });

export const apiKeyRateLimiter = (
  options?: Partial<RateLimitOptions>,
): MiddlewareHandler =>
  rateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 1000,
    message: "API rate limit exceeded.",
    standardHeaders: true,
    keyGenerator: (c) => {
      const apiKey = c.req.header("x-api-key");
      return apiKey
        ? `apikey:${apiKey}`
        : `apikey:anonymous:${extractIp(c)}:ua:${c.req.header("user-agent") ?? "unknown"}`;
    },
    ...options,
  });

export const resetRateLimit = async (identifier: string): Promise<void> => {
  if (!redis || redis.status !== "ready") {
    return;
  }
  await redis.del(`teleb:rate-limit:${identifier}`);
};

export const clearAllRateLimits = async (): Promise<void> => {
  if (!redis || redis.status !== "ready") {
    return;
  }

  let cursor = "0";

  do {
    const [nextCursor, keys] = await redis.scan(
      cursor,
      "MATCH",
      "teleb:rate-limit:*",
      "COUNT",
      100,
    );

    cursor = nextCursor;

    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } while (cursor !== "0");
};
