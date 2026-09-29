import { Hono } from "hono";
import { i18nMiddleware } from "./i18n";
import authRoutes from "./modules/auth/auth.routes";
import { logger } from "hono/logger";
import type { AppEnv } from "./types/app";
import collectionsRoutes from "./modules/collection/collection.routes";

const app = new Hono<AppEnv>().basePath("/v1");

app.use(logger());
app.use("*", i18nMiddleware);
app.route("/auth", authRoutes);
app.route("/collection", collectionsRoutes);

app.get("/", (c) => {
  return c.json({
    success: true,
  });
});

export default app;
