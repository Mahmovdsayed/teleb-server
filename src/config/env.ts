import "dotenv/config";

export const env = {
  ARGON2_MEMORY_COST: Number(process.env.ARGON2_MEMORY_COST) || 65536,
  ARGON2_TIME_COST: Number(process.env.ARGON2_TIME_COST) || 3,
  DATABASE_URL: process.env.DATABASE_URL || "",
  LOGIN_SIG: process.env.LOGIN_SIG || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
};
