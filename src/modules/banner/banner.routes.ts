import { Hono } from "hono";
import type { AppEnv } from "../../types/app";
import { requireAuth } from "../../middleware/auth";
import { adminRateLimiter } from "../../middleware/rate-limit";
import { cacheMiddleware } from "../../middleware/cache";
import { zValidate } from "../../middleware/validate";
import { paramValidationSchema } from "../../validation/global/param.validation";
import {
  addBannerImageSchema,
  bannerImageParamSchema,
  createBannerSchema,
  reorderBannerImagesSchema,
  updateBannerImageSchema,
  updateBannerSchema,
} from "./banner.schema";
import {
  addBannerImageController,
  createBannerController,
  deleteBannerController,
  deleteBannerImageController,
  getAllBannersController,
  getBannerByIdController,
  reorderBannerImagesController,
  updateBannerController,
  updateBannerImageController,
} from "./banner.controller";

const bannerRoutes = new Hono<AppEnv>();

bannerRoutes.get("/", cacheMiddleware({ keyPrefix: "Banners" }), getAllBannersController);
bannerRoutes.get("/:id", cacheMiddleware({ keyPrefix: "Banners" }), zValidate("param", paramValidationSchema), getBannerByIdController);
bannerRoutes.post("/", requireAuth(), adminRateLimiter(), zValidate("json", createBannerSchema), createBannerController);
bannerRoutes.patch("/:id", requireAuth(), adminRateLimiter(), zValidate("param", paramValidationSchema), zValidate("json", updateBannerSchema), updateBannerController);
bannerRoutes.delete("/:id", requireAuth(), adminRateLimiter(), zValidate("param", paramValidationSchema), deleteBannerController);
bannerRoutes.post("/:id/images", requireAuth(), adminRateLimiter(), zValidate("param", paramValidationSchema), zValidate("json", addBannerImageSchema), addBannerImageController);
bannerRoutes.patch("/:id/images/reorder", requireAuth(), adminRateLimiter(), zValidate("param", paramValidationSchema), zValidate("json", reorderBannerImagesSchema), reorderBannerImagesController);
bannerRoutes.patch("/:id/images/:imageId", requireAuth(), adminRateLimiter(), zValidate("param", bannerImageParamSchema), zValidate("json", updateBannerImageSchema), updateBannerImageController);
bannerRoutes.delete("/:id/images/:imageId", requireAuth(), adminRateLimiter(), zValidate("param", bannerImageParamSchema), deleteBannerImageController);

export default bannerRoutes;
