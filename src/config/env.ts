import "dotenv/config";

export const env = {
  ARGON2_MEMORY_COST: Number(Bun.env.ARGON2_MEMORY_COST) || 65536,
  ARGON2_TIME_COST: Number(Bun.env.ARGON2_TIME_COST) || 3,
  DATABASE_URL: Bun.env.DATABASE_URL || "",
  LOGIN_SIG: Bun.env.LOGIN_SIG || "",
  JWT_SECRET: Bun.env.JWT_SECRET || "",
};
