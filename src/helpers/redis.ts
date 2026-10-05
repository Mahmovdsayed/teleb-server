import { Redis } from "ioredis";
import { env } from "../config/env";

let redis: Redis | null = null;

if (env.REDIS_URL) {
  try {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false,
      connectTimeout: 5000,
      retryStrategy(times) {
        if (times > 3) {
          console.warn("⚠️ Redis connection failed after 3 retries, falling back to database-direct mode");
          return null;
        }
        return Math.min(times * 150, 2000);
      },
    });

    redis.on("connect", () => {
      console.log("✅ Redis connected successfully");
    });

    redis.on("error", (error) => {
      if (env.NODE_ENV !== "production") {
        console.warn("⚠️ Redis warning/error:", error.message);
      }
    });
  } catch (err) {
    console.warn("⚠️ Redis initialization error:", err instanceof Error ? err.message : err);
    redis = null;
  }
}

export default redis;
