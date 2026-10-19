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

    for (const [key, value] of entries) {
      sorted.append(key, value);
    }

    return `?${sorted.toString()}`;
  } catch {
    return "";
  }
}

function setCacheHeaders(
  c: Parameters<MiddlewareHandler>[0],
  _clientTtl: number,
  cacheStatus: "HIT" | "MISS",
) {
  c.header("X-Cache", cacheStatus);
  c.header("Cache-Control", "private, no-store");
}

export const cacheMiddleware = (options: CacheOptions): MiddlewareHandler => {
  const {
    keyPrefix,
    ttl = CACHE_TTL,
    includeQuery = true,
    clientTtl = 60,
  } = options;

  return async (c, next) => {
    if (!redis || redis.status !== "ready") {
      await next();
      return;
    }

    const lang = (c.get("lang") as string) || "en";
    const query = includeQuery ? getNormalizedQuery(c.req.url) : "";
    const key = `${keyPrefix}:${lang}:${c.req.path}${query}`;
    const lockKey = `teleb:lock:${key}`;

    let acquired = false;
    let downstreamExecuted = false;

    try {
      const cachedData = await redis.get(key);

      if (cachedData !== null) {
        setCacheHeaders(c, clientTtl, "HIT");

        return c.body(cachedData, 200, {
          "Content-Type": "application/json; charset=UTF-8",
        });
      }

      acquired = Boolean(await redis.set(lockKey, "1", "PX", 4000, "NX"));

      if (!acquired) {
        for (let attempt = 0; attempt < 20; attempt++) {
          await new Promise((resolve) => setTimeout(resolve, 50));

          const polledData = await redis.get(key);

          if (polledData !== null) {
            setCacheHeaders(c, clientTtl, "HIT");

            return c.body(polledData, 200, {
              "Content-Type": "application/json; charset=UTF-8",
            });
          }
        }
      }

      downstreamExecuted = true;
      await next();

      const response = c.res;

      if (
        response.ok &&
        response.status === 200 &&
        response.headers.get("content-type")?.includes("application/json")
      ) {
        const body = await response.clone().text();

        await redis.setex(key, ttl, body);
        setCacheHeaders(c, clientTtl, "MISS");
      }
    } catch (error) {
      console.error("Cache middleware error:", error);

      if (!downstreamExecuted) {
        await next();
      }
    } finally {
      if (acquired) {
        await redis.del(lockKey).catch((error) => {
          console.error("Cache lock cleanup error:", error);
        });
      }
    }
  };
};

export const invalidateCache = async (pattern: string): Promise<number> => {
  if (!redis || redis.status !== "ready") {
    console.warn("[Cache] Invalidation skipped: Redis not ready", {
      pattern,
      status: redis?.status,
    });
    return 0;
  }

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
        totalDeleted += await redis.del(...keys);
      }
    } while (cursor !== "0");

    console.info("[Cache] Invalidation completed", {
      pattern: searchPattern,
      deleted: totalDeleted,
    });

    return totalDeleted;
  } catch (error) {
    console.error("[Cache] Invalidation failed", {
      pattern,
      error,
    });

    throw error;
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
