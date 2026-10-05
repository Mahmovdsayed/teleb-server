import z from "zod";
import { paramValidationSchema } from "../../validation/global/param.validation";

const bannerImageItemSchema = z.object({
  url: z.string().trim().url(),
  publicId: z.string().trim().min(1),
  order: z.number().int().min(0),
});

export const createBannerSchema = z.compile(
  z.object({
    title: z.string().trim().min(1).max(255),
    images: z.array(bannerImageItemSchema).optional(),
  }),
);

export const updateBannerSchema = z.compile(
  z.object({
    title: z.string().trim().min(1).max(255).optional(),
    images: z.array(bannerImageItemSchema).optional(),
  }),
);

export const addBannerImageSchema = z.compile(
  z.object({
    url: z.string().trim().url(),
    publicId: z.string().trim().min(1),
  }),
);

export const updateBannerImageSchema = z.compile(
  z
    .object({
      url: z.string().trim().url().optional(),
      publicId: z.string().trim().min(1).optional(),
    })
    .refine((data) => data.url !== undefined || data.publicId !== undefined, {
      message: "At least one field (url or publicId) must be provided",
    }),
);

export const bannerParamSchema = paramValidationSchema;

export const bannerImageParamSchema = z.compile(
  z.object({
    id: z.coerce.number().int().positive(),
    imageId: z.coerce.number().int().min(0),
  }),
);

export const reorderBannerImagesSchema = z.compile(
  z.object({
    imageIds: z
      .array(z.number().int().min(0))
      .min(1)
      .refine((items) => new Set(items).size === items.length, {
        message: "Duplicate image indexes are not allowed",
      }),
  }),
);

export type CreateBannerInput = z.infer<typeof createBannerSchema>;
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>;
export type BannerParamInput = z.infer<typeof bannerParamSchema>;
export type BannerImageParamInput = z.infer<typeof bannerImageParamSchema>;
export type AddBannerImageInput = z.infer<typeof addBannerImageSchema>;
export type UpdateBannerImageInput = z.infer<typeof updateBannerImageSchema>;
export type ReorderBannerImagesInput = z.infer<typeof reorderBannerImagesSchema>;
