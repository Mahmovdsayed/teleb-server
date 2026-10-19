import z from "zod";
import { paramValidationSchema } from "../../validation/global/param.validation";

const hexColorSchema = z.string().trim().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
  message: "Invalid hex color",
});

const percentageSchema = z
  .string()
  .trim()
  .regex(/^\d{1,3}(\.\d{1,2})?$/, { message: "Invalid percentage format" })
  .refine(
    (val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0 && num <= 100;
    },
    { message: "Percentage must be greater than 0 and less than or equal to 100" },
  );

export const createOfferSchema = z.compile(
  z
    .object({
      arName: z.string().trim().min(1).max(150),
      arDescription: z.string().trim().max(1000).optional(),
      arBannerText: z.string().trim().max(255).optional(),
      enName: z.string().trim().min(1).max(150),
      enDescription: z.string().trim().max(1000).optional(),
      enBannerText: z.string().trim().max(255).optional(),
      percentage: percentageSchema,
      startDate: z.coerce.date(),
      endDate: z.coerce.date(),
      isActive: z.boolean().optional(),
      showBanner: z.boolean().optional(),
      bannerBackgroundColor: hexColorSchema.optional(),
      bannerTextColor: hexColorSchema.optional(),
    })
    .refine((data) => data.startDate < data.endDate, {
      message: "startDate must be before endDate",
      path: ["endDate"],
    }),
);

export const updateOfferSchema = z.compile(
  z
    .object({
      arName: z.string().trim().min(1).max(150).optional(),
      arDescription: z.string().trim().max(1000).optional(),
      arBannerText: z.string().trim().max(255).optional(),
      enName: z.string().trim().min(1).max(150).optional(),
      enDescription: z.string().trim().max(1000).optional(),
      enBannerText: z.string().trim().max(255).optional(),
      percentage: percentageSchema.optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      isActive: z.boolean().optional(),
      showBanner: z.boolean().optional(),
      bannerBackgroundColor: hexColorSchema.optional(),
      bannerTextColor: hexColorSchema.optional(),
    })
    .refine(
      (data) => {
        if (data.startDate && data.endDate) {
          return data.startDate < data.endDate;
        }
        return true;
      },
      {
        message: "startDate must be before endDate",
        path: ["endDate"],
      },
    ),
);

export const updateOfferStatusSchema = z.compile(
  z
    .object({
      value: z.boolean().optional(),
      isActive: z.boolean().optional(),
    })
    .refine((data) => data.value !== undefined || data.isActive !== undefined, {
      message: "value or isActive is required",
    }),
);

export const updateOfferShowBannerSchema = z.compile(
  z
    .object({
      value: z.boolean().optional(),
      showBanner: z.boolean().optional(),
    })
    .refine((data) => data.value !== undefined || data.showBanner !== undefined, {
      message: "value or showBanner is required",
    }),
);

export const offerParamSchema = paramValidationSchema;

export const offerQuerySchema = z.compile(
  z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    isActive: z
      .union([z.boolean(), z.enum(["true", "false"])])
      .transform((v) => v === true || v === "true")
      .optional(),
    showBanner: z
      .union([z.boolean(), z.enum(["true", "false"])])
      .transform((v) => v === true || v === "true")
      .optional(),
    sort: z.enum(["createdAt", "startDate", "endDate", "percentage"]).optional(),
    order: z.enum(["asc", "desc"]).optional(),
  }),
);

export type CreateOfferInput = z.infer<typeof createOfferSchema>;
export type UpdateOfferInput = z.infer<typeof updateOfferSchema>;
export type UpdateOfferStatusInput = z.infer<typeof updateOfferStatusSchema>;
export type UpdateOfferShowBannerInput = z.infer<typeof updateOfferShowBannerSchema>;
export type OfferParamInput = z.infer<typeof offerParamSchema>;
export type OfferQueryInput = z.infer<typeof offerQuerySchema>;
