import { Hono } from "hono";
import type { AppEnv } from "../../types/app";
import { requireAuth } from "../../middleware/auth";
import { zValidate } from "../../middleware/validate";
import { createCollectionSchema, updateCollectionSchema } from "./collection.schemas";
import { createCollectionController, deleteCollectionController, getCollections, updateCollectionController } from "./collection.controller";
import { paramValidationSchema } from "../../validation/global/param.validation";
import { cacheMiddleware } from "../../middleware/cache";
import { adminRateLimiter } from "../../middleware/rate-limit";

const collectionsRoutes = new Hono<AppEnv>();

collectionsRoutes.post("/create", requireAuth(), adminRateLimiter(), zValidate("json", createCollectionSchema), createCollectionController);
collectionsRoutes.patch("/update/:id", requireAuth(), adminRateLimiter(), zValidate("param", paramValidationSchema), zValidate("json", updateCollectionSchema), updateCollectionController);
collectionsRoutes.delete("/delete/:id", requireAuth(), adminRateLimiter(), zValidate("param", paramValidationSchema), deleteCollectionController);
collectionsRoutes.get("/get", cacheMiddleware({keyPrefix:"Collections"}), getCollections);

export default collectionsRoutes;
