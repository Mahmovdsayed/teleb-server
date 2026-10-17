import { Hono } from "hono";
import type { AppEnv } from "../../types/app";
import { requireAuth } from "../../middleware/auth";
import { adminRateLimiter, messageRateLimiter } from "../../middleware/rate-limit";
import { zValidate } from "../../middleware/validate";
import { paramValidationSchema } from "../../validation/global/param.validation";
import { createMessageSchema, messageQuerySchema } from "./message.schema";
import {
  createMessageController,
  deleteMessageController,
  getAllMessagesController,
  getMessageByIdController,
  markMessageAsViewedController,
} from "./message.controller";
import { cacheMiddleware } from "../../middleware/cache";

const messageRoutes = new Hono<AppEnv>();

messageRoutes.post("/create", messageRateLimiter(), zValidate("json", createMessageSchema), createMessageController);

messageRoutes.get("/get", cacheMiddleware({keyPrefix:"Messages"}), requireAuth(), adminRateLimiter(), zValidate("query", messageQuerySchema), getAllMessagesController);
messageRoutes.get("/get/:id", cacheMiddleware({keyPrefix:"Messages"}), requireAuth(), adminRateLimiter(), zValidate("param", paramValidationSchema), getMessageByIdController);
messageRoutes.patch("/update/:id/view", requireAuth(), adminRateLimiter(), zValidate("param", paramValidationSchema), markMessageAsViewedController);
messageRoutes.delete("/delete/:id", requireAuth(), adminRateLimiter(), zValidate("param", paramValidationSchema), deleteMessageController);

export default messageRoutes;
