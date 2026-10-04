import type { MiddlewareHandler } from "hono";
import redis from "../helpers/redis";
import { CACHE_TTL } from "../constant/constant";

interface CacheOptions {
  keyPrefix: string;
  ttl?: number;
  includeQuery?: boolean;
}

export const cacheMiddleware = (options: CacheOptions): MiddlewareHandler => {
  const config = {
    ttl: CACHE_TTL,
    includeQuery: true,
    ...options,
  };

  return async (c, next) => {
    if (!redis || redis.status !== "ready") return next();
    

    const { keyPrefix, ttl, includeQuery } = config;
    const lang = (c.get("lang") as string) || "en";
    const query = includeQuery ? new URL(c.req.url).search : "";
    const key = `${keyPrefix}:${lang}:${c.req.path}${query}`;

    try {
      const cachedData = await redis.get(key);
      if (cachedData) return c.json(JSON.parse(cachedData));

      await next();
      const response = c.res;

      if (response.ok && response.headers.get("content-type")?.includes("application/json")) {
        const body = await response.clone().text();
        await redis.setex(key, ttl, body);
      }

      return;
    } catch (error) {
      console.error("Cache error:", error);
      return next();
    }
  };
};

export const invalidateCache = async (pattern: string): Promise<number> => {
  if (!redis || redis.status !== "ready") return 0;

  try {
    const searchPattern = pattern.includes("*") ? pattern : `${pattern}*`;

    let cursor = "0";
    let totalDeleted = 0;

    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", searchPattern, "COUNT", 100);
      cursor = nextCursor;

      if (keys.length > 0) {
        await redis.del(...keys);
        totalDeleted += keys.length;
      }
    } while (cursor !== "0");

    return totalDeleted;
  } catch (error) {
    console.error("Cache invalidation error:", error);
    return 0;
  }
};

export const invalidateCacheKey = async (key: string): Promise<void> => {
  if (!redis || redis.status !== "ready") return;
  
  try {
    await redis.del(key);
  } catch (error) {
    console.error("Cache invalidation error:", error);
  }
};
