import type { MiddlewareHandler } from "hono";
import redis from "../helpers/redis";
import { CACHE_TTL } from "../constant/constant";

interface CacheOptions {
  keyPrefix: string;
  ttl?: number;
  includeQuery?: boolean;
  clientTtl?: number;
}

function getNormalizedQuery(urlStr: string): string {
  try {
    const url = new URL(urlStr);
    const entries = Array.from(url.searchParams.entries()).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    if (entries.length === 0) return "";
    const sorted = new URLSearchParams();
    for (const [k, v] of entries) {
      sorted.append(k, v);
    }
    return `?${sorted.toString()}`;
  } catch {
    return "";
  }
}

export const cacheMiddleware = (options: CacheOptions): MiddlewareHandler => {
  const config = {
    ttl: CACHE_TTL,
    includeQuery: true,
    clientTtl: 60,
    ...options,
  };

  return async (c, next) => {
    if (!redis || redis.status !== "ready") return next();

    const { keyPrefix, ttl, includeQuery, clientTtl } = config;
    const lang = (c.get("lang") as string) || "en";
    const query = includeQuery ? getNormalizedQuery(c.req.url) : "";
    const key = `${keyPrefix}:${lang}:${c.req.path}${query}`;

    try {
      const cachedData = await redis.get(key);
      if (cachedData) {
        c.header("X-Cache", "HIT");
        c.header(
          "Cache-Control",
          `public, max-age=${clientTtl}, s-maxage=${clientTtl * 5}, stale-while-revalidate=600`,
        );
        return c.body(cachedData, 200, {
          "Content-Type": "application/json; charset=UTF-8",
        });
      }

      const lockKey = `teleb:lock:${key}`;
      const acquired = await redis.set(lockKey, "1", "PX", 4000, "NX");

      if (!acquired) {
        const pollInterval = 50;
        const maxAttempts = 20;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          await new Promise((r) => setTimeout(r, pollInterval));
          const polledData = await redis.get(key);
          if (polledData) {
            c.header("X-Cache", "HIT");
            c.header(
              "Cache-Control",
              `public, max-age=${clientTtl}, s-maxage=${clientTtl * 5}, stale-while-revalidate=600`,
            );
            return c.body(polledData, 200, {
              "Content-Type": "application/json; charset=UTF-8",
            });
          }
        }
      }

      try {
        await next();
        const response = c.res;

        if (
          response.ok &&
          response.headers.get("content-type")?.includes("application/json")
        ) {
          const body = await response.clone().text();
          await redis.setex(key, ttl, body);
          c.header("X-Cache", "MISS");
          c.header(
            "Cache-Control",
            `public, max-age=${clientTtl}, s-maxage=${clientTtl * 5}, stale-while-revalidate=600`,
          );
        }
      } finally {
        if (acquired) {
          await redis.del(lockKey).catch(() => {});
        }
      }

      return;
    } catch (error) {
      console.error("Cache middleware error:", error);
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
      const [nextCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        searchPattern,
        "COUNT",
        100,
      );
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
