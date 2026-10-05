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

const messageRoutes = new Hono<AppEnv>();

messageRoutes.post("/", messageRateLimiter(), zValidate("json", createMessageSchema), createMessageController);

messageRoutes.get("/", requireAuth(), adminRateLimiter(), zValidate("query", messageQuerySchema), getAllMessagesController);
messageRoutes.get("/:id", requireAuth(), adminRateLimiter(), zValidate("param", paramValidationSchema), getMessageByIdController);
messageRoutes.patch("/:id/view", requireAuth(), adminRateLimiter(), zValidate("param", paramValidationSchema), markMessageAsViewedController);
messageRoutes.delete("/:id", requireAuth(), adminRateLimiter(), zValidate("param", paramValidationSchema), deleteMessageController);

export default messageRoutes;
