import { Hono } from "hono";
import { zValidate } from "../../middleware/validate";
import { signInSchema } from "./auth.schemas";
import { logOutController, signInController } from "./auth.controller";
import type { AppEnv } from "../../types/app";

const authRoutes = new Hono<AppEnv>();

// authRoutes.post("/register", zValidate("json", signUpSchema), signUpController);
authRoutes.post("/login", zValidate("json", signInSchema), signInController);
authRoutes.post("/logout", logOutController);

export default authRoutes;
