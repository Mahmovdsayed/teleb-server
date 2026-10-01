import { Hono } from "hono";
import { zValidate } from "../../middleware/validate";
import { signInSchema } from "./auth.schemas";
import { logOutController, signInController } from "./auth.controller";
import type { AppEnv } from "../../types/app";
import { authRateLimiter } from "../../middleware/rate-limit";

const authRoutes = new Hono<AppEnv>();

// authRoutes.post("/register", zValidate("json", signUpSchema), signUpController);
authRoutes.post("/login", authRateLimiter(), zValidate("json", signInSchema), signInController);
authRoutes.post("/logout", authRateLimiter(), logOutController);

export default authRoutes;
