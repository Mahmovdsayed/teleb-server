import z from "zod";

const productTranslationSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().optional(),
  smallDescription: z.string().trim().optional(),
  materials: z.array(z.object({ name: z.string().trim().min(1) })).optional(),
  features: z.array(z.object({ name: z.string().trim().min(1) })).optional(),
  height: z.string().trim().nullable().optional(),
  width: z.string().trim().nullable().optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  metaTitle: z.string().trim().optional(),
  metaDescription: z.string().trim().optional(),
  metaKeywords: z.array(z.string().trim().min(1)).optional(),
});

export const createProductSchema = z.compile(
  z.object({
    collectionId: z.number().int().positive(),
    offerId: z.number().int().positive().nullable().optional(),
    slug: z.string().trim().min(1).max(255),
    status: z.enum(["active", "inactive"]).optional(),
    isBestSeller: z.boolean().optional(),
    isCustomizable: z.boolean().optional(),
    warranty: z.number().int().min(0).optional(),
    weight: z.string().trim().nullable().optional(),
    translations: z.object({
      ar: productTranslationSchema,
      en: productTranslationSchema,
    }),
    variants: z
      .array(
        z.object({
          size: z.string().trim().optional(),
          weight: z.string().trim().nullable().optional(),
          isAvailable: z.boolean().optional(),
        }),
      )
      .optional(),
  }),
);

export const updateProductSchema = z.compile(
  z.object({
    collectionId: z.number().int().positive().optional(),
    offerId: z.number().int().positive().nullable().optional(),
    slug: z.string().trim().min(1).max(255).optional(),
    status: z.enum(["active", "inactive"]).optional(),
    isBestSeller: z.boolean().optional(),
    isCustomizable: z.boolean().optional(),
    warranty: z.number().int().min(0).optional(),
    weight: z.string().trim().nullable().optional(),
    translations: z
      .object({
        ar: productTranslationSchema.partial().optional(),
        en: productTranslationSchema.partial().optional(),
      })
      .optional(),
  }),
);

export const productParamSchema = z.compile(
  z.object({
    id: z.coerce.number().int().positive(),
  }),
);

export const productSlugParamSchema = z.compile(
  z.object({
    slug: z.string().trim().min(1),
  }),
);

export const productQuerySchema = z.compile(
  z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    collectionId: z.coerce.number().int().positive().optional(),
    offerId: z.coerce.number().int().positive().optional(),
    status: z.enum(["active", "inactive"]).optional(),
    bestSeller: z
      .string()
      .transform((v) => v === "true")
      .pipe(z.boolean())
      .optional(),
    sort: z.enum(["createdAt", "name"]).optional(),
    order: z.enum(["asc", "desc"]).optional(),
    lang: z.enum(["ar", "en"]).optional(),
  }),
);

export const searchProductQuerySchema = z.compile(
  z.object({
    q: z.string().trim().min(1),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    lang: z.enum(["ar", "en"]).optional(),
  }),
);

export const updateStatusSchema = z.compile(
  z.object({
    status: z.enum(["active", "inactive"]),
  }),
);

export const updateBestSellerSchema = z.compile(
  z.object({
    value: z.boolean(),
  }),
);

const imageItemSchema = z.object({
  url: z.string().trim().min(1),
  publicId: z.string().trim().min(1),
  order: z.number().int().min(0).optional(),
  isMain: z.boolean().optional(),
});

export const createProductImageSchema = z.compile(
  z.union([
    z.object({
      images: z.array(imageItemSchema).min(1).max(5),
    }),
    z.array(imageItemSchema).min(1).max(5),
    imageItemSchema,
  ]),
);

export const updateProductImageSchema = z.compile(
  z.object({
    url: z.string().trim().min(1).optional(),
    publicId: z.string().trim().min(1).optional(),
    order: z.number().int().min(0).optional(),
    isMain: z.boolean().optional(),
  }),
);

export const imageParamSchema = z.compile(
  z.object({
    id: z.coerce.number().int().positive(),
    imageId: z.coerce.number().int().positive(),
  }),
);

export const setMainImageSchema = z.compile(
  z.object({
    imageId: z.number().int().positive(),
  }),
);

export const reorderImagesSchema = z.compile(
  z.object({
    imageIds: z.array(z.number().int().positive()).min(1),
  }),
);

export const createProductVariantSchema = z.compile(
  z.object({
    size: z.string().trim().optional(),
    weight: z.string().trim().nullable().optional(),
    isAvailable: z.boolean().optional(),
  }),
);

export const updateProductVariantSchema = z.compile(
  z.object({
    size: z.string().trim().optional(),
    weight: z.string().trim().nullable().optional(),
    isAvailable: z.boolean().optional(),
  }),
);

export const variantParamSchema = z.compile(
  z.object({
    id: z.coerce.number().int().positive(),
    variantId: z.coerce.number().int().positive(),
  }),
);

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductParamInput = z.infer<typeof productParamSchema>;
export type ProductSlugParamInput = z.infer<typeof productSlugParamSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
export type SearchProductQueryInput = z.infer<typeof searchProductQuerySchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type UpdateBestSellerInput = z.infer<typeof updateBestSellerSchema>;
export type CreateProductImageInput = z.infer<typeof createProductImageSchema>;
export type UpdateProductImageInput = z.infer<typeof updateProductImageSchema>;
export type ImageParamInput = z.infer<typeof imageParamSchema>;
export type SetMainImageInput = z.infer<typeof setMainImageSchema>;
export type ReorderImagesInput = z.infer<typeof reorderImagesSchema>;
export type CreateProductVariantInput = z.infer<
  typeof createProductVariantSchema
>;
export type UpdateProductVariantInput = z.infer<
  typeof updateProductVariantSchema
>;
export type VariantParamInput = z.infer<typeof variantParamSchema>;
