import { Hono } from "hono";
import type { AppEnv } from "../../types/app";
import { requireAuth } from "../../middleware/auth";
import { adminRateLimiter } from "../../middleware/rate-limit";
import { cacheMiddleware } from "../../middleware/cache";
import { zValidate } from "../../middleware/validate";
import { paramValidationSchema } from "../../validation/global/param.validation";
import {
  createOfferSchema,
  offerQuerySchema,
  updateOfferSchema,
  updateOfferShowBannerSchema,
  updateOfferStatusSchema,
} from "./offer.schema";
import {
  createOfferController,
  deleteOfferController,
  getAllOffersController,
  getCurrentBannerOfferController,
  getOfferByIdController,
  updateOfferController,
  updateOfferShowBannerController,
  updateOfferStatusController,
} from "./offer.controller";

const offerRoutes = new Hono<AppEnv>();

offerRoutes.get("/get", cacheMiddleware({ keyPrefix: "Offers" }), zValidate("query", offerQuerySchema), getAllOffersController);
offerRoutes.get("/banner",cacheMiddleware({ keyPrefix: "Offers" }),getCurrentBannerOfferController);
offerRoutes.get("/get/:id",cacheMiddleware({ keyPrefix: "Offers" }),zValidate("param", paramValidationSchema),getOfferByIdController);
offerRoutes.post("/create", requireAuth(), adminRateLimiter(), zValidate("json", createOfferSchema), createOfferController);
offerRoutes.patch("/update/:id/status",requireAuth(), adminRateLimiter(), zValidate("param", paramValidationSchema), zValidate("json", updateOfferStatusSchema), updateOfferStatusController);
offerRoutes.patch("/update/:id/show-banner",requireAuth(), adminRateLimiter(), zValidate("param", paramValidationSchema), zValidate("json", updateOfferShowBannerSchema), updateOfferShowBannerController);
offerRoutes.patch("/update/:id",requireAuth(), adminRateLimiter(), zValidate("param", paramValidationSchema), zValidate("json", updateOfferSchema), updateOfferController);
offerRoutes.delete("/delete/:id",requireAuth(), adminRateLimiter(), zValidate("param", paramValidationSchema), deleteOfferController);

export default offerRoutes;
