import { Redis } from "ioredis";
import { env } from "../config/env";

let redis: Redis | null = null;

if (env.REDIS_URL) {
  redis = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) {
        console.warn("⚠️ Redis connection failed after 3 retries, disabling Redis");
        return null;
      }

      return Math.min(times * 100, 3000);
    },
  });

  redis.on("connect", () => {
    console.log("✅ Redis connected");
  });

  redis.on("error", (error) => {
    console.error("❌ Redis error:", error.message);
  });
}

export default redis;
