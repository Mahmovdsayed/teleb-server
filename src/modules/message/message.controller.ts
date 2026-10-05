import { t, type Lang } from "../../i18n";
import { invalidateCache } from "../../middleware/cache";
import type { AppContext } from "../../types/http";
import { messageService } from "./message.service";
import type {
  CreateMessageInput,
  MessageParamInput,
  MessageQueryInput,
} from "./message.schema";

type CreateMessageCtx = AppContext<{ out: { json: CreateMessageInput } }>;
type GetMessagesCtx = AppContext<{ out: { query: MessageQueryInput } }>;
type GetMessageByIdCtx = AppContext<{ out: { param: MessageParamInput } }>;
type MarkMessageAsViewedCtx = AppContext<{ out: { param: MessageParamInput } }>;
type DeleteMessageCtx = AppContext<{ out: { param: MessageParamInput } }>;

const MESSAGE_CACHE_KEY = "Messages";

export const createMessageController = async (c: CreateMessageCtx) => {
  try {
    const input = c.req.valid("json");
    const lang = c.get("lang")

    await messageService.create(input, lang);
    await invalidateCache(MESSAGE_CACHE_KEY);

    return c.json({
      success: true,
      message: t(c, "message.created"),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "MESSAGE_ALREADY_PENDING") {
      return c.json({ success: false, message: t(c, "message.pending") });
    }
    if (error instanceof Error && error.message === "MESSAGE_CREATE_FAILED") {
      return c.json({ success: false, message: t(c, "message.createFailed") });
    }
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

export const getAllMessagesController = async (c: GetMessagesCtx) => {
  try {
    const query = c.req.valid("query");
    const result = await messageService.getAll(query);
    return c.json({ success: true, data: result.data, total: result.total });
  } catch {
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

export const getMessageByIdController = async (c: GetMessageByIdCtx) => {
  try {
    const { id } = c.req.valid("param");
    const message = await messageService.getById(id);
    return c.json({ success: true, data: message });
  } catch (error) {
    if (error instanceof Error && error.message === "MESSAGE_NOT_FOUND") {
      return c.json({ success: false, message: t(c, "message.notFound") });
    }
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

export const markMessageAsViewedController = async (c: MarkMessageAsViewedCtx) => {
  try {
    const { id } = c.req.valid("param");
    const message = await messageService.markAsViewed(id);
    await invalidateCache(MESSAGE_CACHE_KEY);

    return c.json({
      success: true,
      message: t(c, "message.viewed"),
      data: message,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "MESSAGE_NOT_FOUND") {
      return c.json({ success: false, message: t(c, "message.notFound") });
    }
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

export const deleteMessageController = async (c: DeleteMessageCtx) => {
  try {
    const { id } = c.req.valid("param");
    await messageService.delete(id);
    await invalidateCache(MESSAGE_CACHE_KEY);

    return c.json({
      success: true,
      message: t(c, "message.deleted"),
    });
  } catch (error) {
    if (error instanceof Error && error.message === "MESSAGE_NOT_FOUND") {
      return c.json({ success: false, message: t(c, "message.notFound") });
    }
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};
