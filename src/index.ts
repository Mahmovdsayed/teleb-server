import { Hono } from "hono";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { cors } from "hono/cors";
import { bodyLimit } from "hono/body-limit";
import { timeout } from "hono/timeout";
import { compress } from "hono/compress";
import { HTTPException } from "hono/http-exception";
import { i18nMiddleware, t } from "./i18n";
import { env } from "./config/env";
import type { AppEnv } from "./types/app";
import authRoutes from "./modules/auth/auth.routes";
import collectionsRoutes from "./modules/collection/collection.routes";
import productRoutes from "./modules/product/product.routes";
import bannerRoutes from "./modules/banner/banner.routes";
import offerRoutes from "./modules/offer/offer.routes";
import messageRoutes from "./modules/message/message.routes";
import redis from "./helpers/redis";
import { globalRateLimiter } from "./middleware/rate-limit";

const app = new Hono<AppEnv>().basePath("/v1");

app.use("*", requestId());

app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;
  const reqId = c.get("requestId") ?? "-";
  console.log(
    `[${reqId}] ${c.req.method} ${c.req.path} ${c.res.status} ${duration}ms`,
  );
});

app.use(
  "*",
  secureHeaders({
    xContentTypeOptions: "nosniff",
    xFrameOptions: "DENY",
    referrerPolicy: "strict-origin-when-cross-origin",
    strictTransportSecurity: "max-age=31536000; includeSubDomains; preload",
    permissionsPolicy: {
      camera: [],
      microphone: [],
      geolocation: [],
    },
  }),
);

const productionOrigins = [
  "https://teleb-furniture.com",
  "https://www.teleb-furniture.com",
];

const devOrigins = [
  ...productionOrigins,
  // "http://localhost:3000",
];

const defaultAllowedOrigins =
  env.NODE_ENV === "production" ? productionOrigins : devOrigins;

const configuredOrigins = env.CORS_ORIGIN
  ? env.CORS_ORIGIN.split(",")
      .map((o) => o.trim())
      .filter(Boolean)
  : defaultAllowedOrigins;

app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin) return configuredOrigins[0]!;
      if (configuredOrigins.includes(origin)) return origin;
      if (/^https:\/\/([a-z0-9-]+\.)*teleb-furniture\.com$/.test(origin)) return origin;
      return null;
    },
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept-Language",
      "x-lang",
      "X-Load-Test",
    ],
    exposeHeaders: [
      "RateLimit-Limit",
      "RateLimit-Remaining",
      "RateLimit-Reset",
      "Retry-After",
      "X-Request-Id",
      "X-Cache",
    ],
    maxAge: 86400,
  }),
);

app.use(
  "*",
  bodyLimit({
    maxSize: 1024 * 1024 * 2,
    onError: (c) => {
      return c.json(
        {
          success: false,
          message: t(c, "common.payloadTooLarge"),
        },
        413,
      );
    },
  }),
);

app.use(
  "*",
  timeout(30000, () => new HTTPException(504, { message: "Gateway Timeout" })),
);
app.use("*", compress());
app.use("*", globalRateLimiter());
app.use("*", i18nMiddleware);

app.route("/auth", authRoutes);
app.route("/collection", collectionsRoutes);
app.route("/products", productRoutes);
app.route("/banner", bannerRoutes);
app.route("/offer", offerRoutes);
app.route("/message", messageRoutes);

app.get("/", (c) => {
  return c.json({ success: true, redis: redis?.status === "ready" });
});

app.onError((err, c) => {
  const reqId = c.get("requestId") ?? "-";
  console.error(`[${reqId}] Unhandled Error:`, err);

  if (err instanceof HTTPException) {
    if (err.status === 504) {
      return c.json(
        {
          success: false,
          message: t(c, "common.requestTimeout"),
        },
        504,
      );
    }

    return c.json(
      {
        success: false,
        message: err.message || t(c, "common.serverError"),
      },
      err.status,
    );
  }

  return c.json(
    {
      success: false,
      message: t(c, "common.internalServerError"),
    },
    500,
  );
});

app.notFound((c) => {
  return c.json(
    {
      success: false,
      message: t(c, "common.notFound"),
    },
    404,
  );
});

export default app;
