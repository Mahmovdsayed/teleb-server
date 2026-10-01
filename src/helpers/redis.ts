import { Redis } from "ioredis";
import { env } from "../config/env";

let redis: Redis | null = null;

const redisUrl = env.REDIS_URL!;
console.log("🔌 Attempting to connect to Redis at:", redisUrl);

redis = new Redis(redisUrl!, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) {
      console.warn("⚠️ Redis connection failed after 3 retries, disabling Redis");
      return null;
    }
    return Math.min(times * 100, 3000);
  },
});

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error", (err) => {
  console.error("❌ Redis error:", err.message);
});

export default redis;
