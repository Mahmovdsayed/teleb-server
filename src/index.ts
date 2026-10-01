import { Hono } from "hono";
import { i18nMiddleware } from "./i18n";
import authRoutes from "./modules/auth/auth.routes";
import { logger } from "hono/logger";
import type { AppEnv } from "./types/app";
import collectionsRoutes from "./modules/collection/collection.routes";
import { compress } from "hono/compress";
import { secureHeaders } from "hono/secure-headers";
import { poweredBy } from "hono/powered-by";
import redis from "./helpers/redis";

const app = new Hono<AppEnv>().basePath("/v1");

app.use(logger());
app.use(compress());
app.use(secureHeaders());
app.use("*", poweredBy());

app.use("*", i18nMiddleware);
app.route("/auth", authRoutes);
app.route("/collection", collectionsRoutes);

app.get("/", (c) => {
  return c.json({
    success: true,
    redis: redis?.status === "ready",
  });
});

export default app;
