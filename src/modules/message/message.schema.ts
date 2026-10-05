import z from "zod";
import { paramValidationSchema } from "../../validation/global/param.validation";

export const createMessageSchema = z.compile(
  z.object({
    fullName: z.string().trim().min(2).max(100),
    email: z.string().trim().email(),
    phone: z.string().trim().min(3).max(30),
    subject: z.string().trim().min(2).max(200),
    message: z.string().trim().min(5).max(5000),
  }),
);

export const messageParamSchema = paramValidationSchema;

export const messageQuerySchema = z.compile(
  z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    isViewed: z
      .union([z.boolean(), z.enum(["true", "false"])])
      .transform((v) => v === true || v === "true")
      .optional(),
    search: z.string().trim().optional(),
    sort: z.enum(["createdAt", "fullName", "email", "subject", "isViewed"]).optional(),
    order: z.enum(["asc", "desc"]).optional(),
  }),
);

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type MessageParamInput = z.infer<typeof messageParamSchema>;
export type MessageQueryInput = z.infer<typeof messageQuerySchema>;
