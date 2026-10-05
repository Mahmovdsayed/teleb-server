import type { Context, MiddlewareHandler } from "hono";
import redis from "../helpers/redis";
import { t } from "../i18n";
import { env } from "../config/env";

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
  statusCode?: number;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
  keyGenerator?: (c: Context) => string | Promise<string>;
}

export function extractIp(c: Context): string {
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
    message,
    statusCode = 429,
    standardHeaders = true,
    legacyHeaders = false,
    keyGenerator,
  } = options;

  return async (c, next) => {
    if (!redis || redis.status !== "ready") return next();

    const bypassKey = env.LOAD_TEST_BYPASS_KEY;
    if (
      bypassKey &&
      env.NODE_ENV !== "production" &&
      c.req.header("X-Load-Test") === bypassKey
    ) {
      return next();
    }

    const ip = extractIp(c);
    const identifier = keyGenerator
      ? await keyGenerator(c)
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

        const localizedMessage = message || t(c, "common.rateLimitExceeded");

        return c.json(
          {
            success: false,
            message: localizedMessage,
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
    standardHeaders: true,
    keyGenerator: (c) => `global:${extractIp(c)}`,
    ...options,
  });

export const authRateLimiter = (
  options?: Partial<RateLimitOptions>,
): MiddlewareHandler =>
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    keyGenerator: (c) => `auth:${extractIp(c)}`,
    ...options,
  });

export const loginRateLimiter = (
  options?: Partial<RateLimitOptions>,
): MiddlewareHandler => {
  return async (c, next) => {
    let email = "";
    try {
      const cloned = c.req.raw.clone();
      const raw: unknown = await cloned.json();
      if (
        raw !== null &&
        typeof raw === "object" &&
        "email" in raw &&
        typeof (raw as Record<string, unknown>).email === "string"
      ) {
        email = (String((raw as Record<string, unknown>).email)).trim().toLowerCase();
      }
    } catch {
    }

    const ip = extractIp(c);
    const identifier = email ? `auth:ip_email:${ip}:${email}` : `auth:ip:${ip}`;
    const maxLimit = email ? 5 : 10;

    return rateLimiter({
      windowMs: 15 * 60 * 1000,
      max: maxLimit,
      skipSuccessfulRequests: true,
      standardHeaders: true,
      keyGenerator: () => identifier,
      ...options,
    })(c, next);
  };
};

export const messageRateLimiter = (
  options?: Partial<RateLimitOptions>,
): MiddlewareHandler =>
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    keyGenerator: (c) => `message:${extractIp(c)}`,
    ...options,
  });

export const strictRateLimiter = (
  options?: Partial<RateLimitOptions>,
): MiddlewareHandler =>
  rateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    keyGenerator: (c) => `strict:${extractIp(c)}`,
    ...options,
  });

export const adminRateLimiter = (
  options?: Partial<RateLimitOptions>,
): MiddlewareHandler =>
  rateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    keyGenerator: (c) => `admin:${extractIp(c)}`,
    ...options,
  });

export const resetRateLimit = async (identifier: string): Promise<void> => {
  if (!redis || redis.status !== "ready") return;
  await redis.del(`teleb:rate-limit:${identifier}`);
};

export const clearAllRateLimits = async (): Promise<void> => {
  if (!redis || redis.status !== "ready") return;

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
