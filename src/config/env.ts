import "dotenv/config";
import z from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  ARGON2_MEMORY_COST: z.coerce.number().int().positive().default(65536),
  ARGON2_TIME_COST: z.coerce.number().int().positive().default(3),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  LOGIN_SIG: z.string().min(16, "LOGIN_SIG must be at least 16 characters"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),

  SMTP_HOST: z.string().min(1, "SMTP_HOST is required"),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.preprocess((val) => val === true || val === "true", z.boolean()).default(false),
  SMTP_USER: z.string().min(1, "SMTP_USER is required"),
  SMTP_PASSWORD: z.string().min(1, "SMTP_PASSWORD is required"),
  MAIL_FROM: z.string().min(1, "MAIL_FROM is required"),
  ADMIN_EMAIL: z.string().email("ADMIN_EMAIL must be a valid email"),

  CORS_ORIGIN: z.string().optional(),
  COOKIE_DOMAIN: z.string().optional(),
  LOAD_TEST_BYPASS_KEY: z.string().optional(),
});

function validateEnv() {
  const result = envSchema.safeParse(Bun.env);

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((issue) => ` - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    console.error(`\n❌ [ENVIRONMENT CONFIG ERROR] Invalid or missing configuration:\n${errorDetails}\n`);
    throw new Error("Invalid server environment configuration");
  }

  return result.data;
}

export const env = validateEnv();
export type Environment = z.infer<typeof envSchema>;
