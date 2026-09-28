import { Hono } from "hono";
import { i18nMiddleware, type Lang } from "./i18n";
import authRoutes from "./modules/auth/auth.routes";
import { logger } from "hono/logger";

const app = new Hono<{ Variables: { lang: Lang } }>().basePath("/v1");

app.use(logger());
app.use("*", i18nMiddleware);
app.route("/auth", authRoutes);

app.get("/", (c) => {
  return c.json({
    success: true,
  });
});

export default app;
