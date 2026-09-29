import { Hono } from "hono";
import type { AppEnv } from "../../types/app";
import { requireAuth } from "../../middleware/auth";
import { zValidate } from "../../middleware/validate";
import { createCollectionSchema, updateCollectionSchema } from "./collection.schemas";
import { createCollectionController, updateCollectionController } from "./collection.controller";
import { paramValidationSchema } from "../../validation/global/param.validation";

const collectionsRoutes = new Hono<AppEnv>();

collectionsRoutes.post(
  "/create",
  requireAuth(),
  zValidate("json", createCollectionSchema),
  createCollectionController,
);

collectionsRoutes.patch(
  "/update/:id",
  requireAuth(),
  zValidate("param", paramValidationSchema),
  zValidate("json", updateCollectionSchema),
  updateCollectionController,
);

export default collectionsRoutes;
