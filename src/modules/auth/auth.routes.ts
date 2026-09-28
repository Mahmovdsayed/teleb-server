import { Hono } from "hono";
import type { Lang } from "../../i18n";
import { zValidate } from "../../middleware/validate";
import { signInSchema, signUpSchema } from "./auth.schemas";
import { signInController, signUpController } from "./auth.controller";

const authRoutes = new Hono<{ Variables: { lang: Lang } }>();

authRoutes.post("/register", zValidate("json", signUpSchema), signUpController);
authRoutes.post("/login", zValidate("json", signInSchema), signInController);

export default authRoutes;
