import { Hono } from "hono";
import type { Lang } from "../../i18n";
import { zValidate } from "../../middleware/validate";
import { singUpSchema } from "./auth.schemas";
import { signUpController } from "./auth.controller";

const authRoutes = new Hono<{ Variables: { lang: Lang } }>();

authRoutes.post("/register", zValidate("json", singUpSchema), signUpController);

export default authRoutes;
