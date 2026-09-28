import { Hono } from "hono";
import type { Lang } from "../../i18n";
import { zValidate } from "../../middleware/validate";
import { signInSchema } from "./auth.schemas";
import { logOutController, signInController } from "./auth.controller";
import { requireAuth } from "../../middleware/auth";

const authRoutes = new Hono<{ Variables: { lang: Lang } }>();

// authRoutes.post("/register", zValidate("json", signUpSchema), signUpController);
authRoutes.post("/login", zValidate("json", signInSchema), signInController);
authRoutes.post("/logout", requireAuth(), logOutController);

export default authRoutes;
