import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  arrayContains,
  or,
  inArray,
  sql,
} from "drizzle-orm";
import {
  productImageTable,
  productTable,
  productTranslationTable,
  productVariantTable,
  collectionTable,
} from "../../database/schemas";
import type {
  CreateProduct,
  CreateProductImage,
  CreateProductVariant,
  GetProductsOptions,
  SearchProductOptions,
  IProductService,
  Locale,
  ProductImage,
  ProductResponse,
  ProductTranslation,
  ProductVariant,
  UpdateProduct,
  UpdateProductImage,
  UpdateProductVariant,
} from "./product.types";
import { db } from "../../database";

async function buildProductResponse(id: number): Promise<ProductResponse> {
  const [rows, images, variants] = await db.batch([
    db
      .select({ product: productTable, translation: productTranslationTable })
      .from(productTable)
      .leftJoin(
        productTranslationTable,
        eq(productTranslationTable.productId, productTable.id),
      )
      .where(eq(productTable.id, id)),

    db
      .select()
      .from(productImageTable)
      .where(eq(productImageTable.productId, id))
      .orderBy(asc(productImageTable.order)),

    db
      .select()
      .from(productVariantTable)
      .where(eq(productVariantTable.productId, id)),
  ]);

  const row = rows[0];
  if (!row) throw new Error("PRODUCT_NOT_FOUND");

  const translations = rows
    .map((r) => r.translation)
    .filter((t): t is NonNullable<typeof t> => t !== null);

  return {
    id: row.product.id,
    slug: row.product.slug,
    status: row.product.status,
    isBestSeller: row.product.isBestSeller,
    isCustomizable: row.product.isCustomizable,
    warranty: row.product.warranty,
    weight: row.product.weight,
    translations,
    images,
    variants,
  };
}

function getErrorCode(err: unknown): string | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  if ("code" in err && typeof (err as { code: unknown }).code === "string") {
    return (err as { code: string }).code;
  }
  if (
    "cause" in err &&
    typeof (err as { cause: unknown }).cause === "object" &&
    (err as { cause: unknown }).cause !== null &&
    "code" in ((err as { cause: object }).cause as object)
  ) {
    const causeCode = (err as { cause: { code?: unknown } }).cause.code;
    return typeof causeCode === "string" ? causeCode : undefined;
  }
  return undefined;
}

function isUniqueViolation(err: unknown): boolean {
  return getErrorCode(err) === "23505";
}

function isForeignKeyViolation(err: unknown): boolean {
  return getErrorCode(err) === "23503";
}

class ProductService implements IProductService {
  public async getAll(
    options: GetProductsOptions,
    locale: Locale,
  ): Promise<{ data: ProductResponse[]; total: number }> {
    const {
      page,
      limit,
      collectionId,
      offerId,
      status,
      bestSeller,
      sort = "createdAt",
      order = "desc",
    } = options;
    const offset = (page - 1) * limit;
    const conditions = [];

    if (collectionId !== undefined)
      conditions.push(eq(productTable.collectionId, collectionId));
    if (offerId !== undefined)
      conditions.push(eq(productTable.offerId, offerId));
    if (status !== undefined) conditions.push(eq(productTable.status, status));
    if (bestSeller !== undefined)
      conditions.push(eq(productTable.isBestSeller, bestSeller));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const sortColumn = {
      createdAt: productTable.createdAt,
      name: productTranslationTable.name,
    }[sort];
    const orderBy = order === "asc" ? asc(sortColumn) : desc(sortColumn);

    const [products, countResult] = await db.batch([
      db
        .select({ product: productTable, translation: productTranslationTable })
        .from(productTable)
        .leftJoin(
          productTranslationTable,
          and(
            eq(productTranslationTable.productId, productTable.id),
            eq(productTranslationTable.locale, locale),
          ),
        )
        .leftJoin(
          collectionTable,
          eq(collectionTable.id, productTable.collectionId),
        )
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),

      db
        .select({ count: count() })
        .from(productTable)
        .leftJoin(
          productTranslationTable,
          and(
            eq(productTranslationTable.productId, productTable.id),
            eq(productTranslationTable.locale, locale),
          ),
        )
        .leftJoin(
          collectionTable,
          eq(collectionTable.id, productTable.collectionId),
        )
        .where(where),
    ]);

    const productIds = products.map((p) => p.product.id);
    let allImages: ProductImage[] = [];
    let allVariants: ProductVariant[] = [];

    if (productIds.length > 0) {
      const [imagesRes] = await db.batch([
        db
          .select()
          .from(productImageTable)
          .where(inArray(productImageTable.productId, productIds))
          .orderBy(
            desc(productImageTable.isMain),
            asc(productImageTable.order),
          ),
      ]);
      allImages = imagesRes;
    }

    const imagesByProductId = new Map<number, ProductImage>();
    for (const img of allImages) {
      if (!imagesByProductId.has(img.productId)) {
        imagesByProductId.set(img.productId, img);
      }
    }

    const data: ProductResponse[] = products.map(({ product, translation }) => {
      const listTranslation = translation
        ? (({
            materials,
            features,
            height,
            width,
            metaTitle,
            metaDescription,
            metaKeywords,
            tags,
            ...rest
          }) => rest as ProductTranslation)(translation)
        : null;

      const mainImage = imagesByProductId.get(product.id);

      return {
        id: product.id,
        slug: product.slug,
        status: product.status,
        isBestSeller: product.isBestSeller,
        isCustomizable: product.isCustomizable,
        translations: listTranslation ? [listTranslation] : [],
        images: mainImage ? [mainImage] : [],
      };
    });

    return { data, total: countResult[0]?.count ?? 0 };
  }

  public async search(options: SearchProductOptions,locale: Locale): Promise<{ data: ProductResponse[]; total: number }> {
    const { q, page, limit } = options;
    const offset = (page - 1) * limit;
    const term = `%${q}%`;

    const matchingIdsSq = db
      .selectDistinct({ id: productTable.id })
      .from(productTable)
      .leftJoin(productTranslationTable, eq(productTranslationTable.productId, productTable.id))
      .leftJoin(collectionTable, eq(collectionTable.id, productTable.collectionId))
      .where(
        or(
          ilike(productTranslationTable.name, term),
          sql`EXISTS (
            SELECT 1 FROM unnest(${productTranslationTable.tags}) AS t
            WHERE t ILIKE ${term}
          )`,
          ilike(collectionTable.arName, term),
          ilike(collectionTable.enName, term),
        ),
      ).as("matching");

    const [products, countResult] = await db.batch([
      db
        .select({ product: productTable, translation: productTranslationTable })
        .from(productTable)
        .innerJoin(matchingIdsSq, eq(matchingIdsSq.id, productTable.id))
        .leftJoin(productTranslationTable,and(eq(productTranslationTable.productId, productTable.id), eq(productTranslationTable.locale, locale)))
        .orderBy(desc(productTable.createdAt))
        .limit(limit)
        .offset(offset),

      db
        .select({ count: count() })
        .from(productTable)
        .innerJoin(matchingIdsSq, eq(matchingIdsSq.id, productTable.id)),
    ]);

    const productIds = products.map((p) => p.product.id);
    let allImages: ProductImage[] = [];

    if (productIds.length > 0) {
      const [imagesRes] = await db.batch([
        db
          .select()
          .from(productImageTable)
          .where(
            and(
              inArray(productImageTable.productId, productIds),
              eq(productImageTable.isMain, true),
            ),
          ),
      ]);
      allImages = imagesRes;
    }

    const imageByProductId = new Map<number, ProductImage>();
    for (const img of allImages) {
      imageByProductId.set(img.productId, img);
    }

    const data: ProductResponse[] = products.map(({ product, translation }) => {
      const listTranslation = translation
        ? (({
            materials,
            features,
            height,
            width,
            metaTitle,
            metaDescription,
            metaKeywords,
            tags,
            ...rest
          }) => rest as ProductTranslation)(translation)
        : null;

      const mainImage = imageByProductId.get(product.id);

      return {
        id: product.id,
        slug: product.slug,
        status: product.status,
        isBestSeller: product.isBestSeller,
        isCustomizable: product.isCustomizable,
        translations: listTranslation ? [listTranslation] : [],
        images: mainImage ? [mainImage] : [],
      };
    });

    return { data, total: countResult[0]?.count ?? 0 };
  }
  public async getById(
    id: number,
    locale: Locale,
  ): Promise<ProductResponse | null> {
    const [result, images, variants] = await db.batch([
      db
        .select({ product: productTable, translation: productTranslationTable })
        .from(productTable)
        .leftJoin(
          productTranslationTable,
          and(
            eq(productTranslationTable.productId, productTable.id),
            eq(productTranslationTable.locale, locale),
          ),
        )
        .where(eq(productTable.id, id))
        .limit(1),

      db
        .select()
        .from(productImageTable)
        .where(eq(productImageTable.productId, id))
        .orderBy(asc(productImageTable.order)),

      db
        .select()
        .from(productVariantTable)
        .where(eq(productVariantTable.productId, id)),
    ]);

    const row = result[0];
    if (!row) throw new Error("PRODUCT_NOT_FOUND");

    return {
      id: row.product.id,
      slug: row.product.slug,
      status: row.product.status,
      isBestSeller: row.product.isBestSeller,
      isCustomizable: row.product.isCustomizable,
      warranty: row.product.warranty,
      weight: row.product.weight,
      translations: row.translation ? [row.translation] : [],
      images,
      variants,
    };
  }

  public async getBySlug(
    slug: string,
    locale: Locale,
  ): Promise<ProductResponse> {
    const [result] = await db
      .select({ product: productTable, translation: productTranslationTable })
      .from(productTable)
      .leftJoin(
        productTranslationTable,
        and(
          eq(productTranslationTable.productId, productTable.id),
          eq(productTranslationTable.locale, locale),
        ),
      )
      .where(eq(productTable.slug, slug))
      .limit(1);

    if (!result) throw new Error("PRODUCT_NOT_FOUND");

    const [images, variants] = await db.batch([
      db
        .select()
        .from(productImageTable)
        .where(eq(productImageTable.productId, result.product.id))
        .orderBy(asc(productImageTable.order)),

      db
        .select()
        .from(productVariantTable)
        .where(eq(productVariantTable.productId, result.product.id)),
    ]);

    return {
      id: result.product.id,
      slug: result.product.slug,
      status: result.product.status,
      isBestSeller: result.product.isBestSeller,
      isCustomizable: result.product.isCustomizable,
      warranty: result.product.warranty,
      weight: result.product.weight,
      translations: result.translation ? [result.translation] : [],
      images,
      variants,
    };
  }

  public async create(
    data: CreateProduct,
    userId: number,
  ): Promise<ProductResponse> {
    try {
      const [product] = await db
        .insert(productTable)
        .values({
          collectionId: data.collectionId,
          offerId: data.offerId ?? null,
          userId,
          slug: data.slug.trim().toLowerCase(),
          status: data.status ?? "active",
          isBestSeller: data.isBestSeller ?? false,
          isCustomizable: data.isCustomizable ?? false,
          warranty: data.warranty ?? 0,
          weight: data.weight ?? null,
        })
        .returning();

      if (!product) throw new Error("PRODUCT_CREATE_FAILED");

      let translations: ProductTranslation[] = [];
      let variants: ProductVariant[] = [];

      try {
        const translationValues = [
          {
            productId: product.id,
            locale: "ar" as const,
            ...data.translations.ar,
            tags: data.translations.ar.tags ?? [],
            materials: data.translations.ar.materials ?? [],
            features: data.translations.ar.features ?? [],
            metaKeywords: data.translations.ar.metaKeywords ?? [],
          },
          {
            productId: product.id,
            locale: "en" as const,
            ...data.translations.en,
            tags: data.translations.en.tags ?? [],
            materials: data.translations.en.materials ?? [],
            features: data.translations.en.features ?? [],
            metaKeywords: data.translations.en.metaKeywords ?? [],
          },
        ];

        if (data.variants?.length) {
          const variantValues = data.variants.map((variant) => ({
            productId: product.id,
            size: variant.size ?? null,
            weight: variant.weight ?? null,
            isAvailable: variant.isAvailable ?? true,
          }));

          const [tRes, vRes] = await db.batch([
            db
              .insert(productTranslationTable)
              .values(translationValues)
              .returning(),
            db.insert(productVariantTable).values(variantValues).returning(),
          ]);
          translations = tRes;
          variants = vRes;
        } else {
          translations = await db
            .insert(productTranslationTable)
            .values(translationValues)
            .returning();
        }
      } catch (innerErr) {
        await db.delete(productTable).where(eq(productTable.id, product.id));
        throw innerErr;
      }

      return {
        id: product.id,
        slug: product.slug,
        status: product.status,
        isBestSeller: product.isBestSeller,
        isCustomizable: product.isCustomizable,
        warranty: product.warranty,
        weight: product.weight,
        translations,
        images: [],
        variants,
      };
    } catch (err) {
      if (isUniqueViolation(err))
        throw new Error("PRODUCT_SLUG_ALREADY_EXISTS");
      if (isForeignKeyViolation(err)) throw new Error("COLLECTION_NOT_FOUND");
      throw err;
    }
  }

  public async update(
    id: number,
    data: UpdateProduct,
  ): Promise<ProductResponse> {
    try {
      const { translations, ...productData } = data;

      const [product] = await db
        .update(productTable)
        .set({
          ...productData,
          ...(data.slug && { slug: data.slug.trim().toLowerCase() }),
          updatedAt: new Date(),
        })
        .where(eq(productTable.id, id))
        .returning();

      if (!product) throw new Error("PRODUCT_NOT_FOUND");

      if (translations?.ar) {
        await db
          .update(productTranslationTable)
          .set({ ...translations.ar })
          .where(
            and(
              eq(productTranslationTable.productId, id),
              eq(productTranslationTable.locale, "ar"),
            ),
          );
      }

      if (translations?.en) {
        await db
          .update(productTranslationTable)
          .set({ ...translations.en })
          .where(
            and(
              eq(productTranslationTable.productId, id),
              eq(productTranslationTable.locale, "en"),
            ),
          );
      }

      return buildProductResponse(id);
    } catch (err) {
      if (isUniqueViolation(err))
        throw new Error("PRODUCT_SLUG_ALREADY_EXISTS");
      if (isForeignKeyViolation(err)) throw new Error("COLLECTION_NOT_FOUND");
      throw err;
    }
  }

  public async delete(id: number): Promise<void> {
    const [product] = await db
      .delete(productTable)
      .where(eq(productTable.id, id))
      .returning({ id: productTable.id });

    if (!product) throw new Error("PRODUCT_NOT_FOUND");
  }

  public async updateStatus(
    id: number,
    status: "active" | "inactive",
  ): Promise<ProductResponse> {
    const [product] = await db
      .update(productTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(productTable.id, id))
      .returning();

    if (!product) throw new Error("PRODUCT_NOT_FOUND");

    return buildProductResponse(id);
  }

  public async updateBestSeller(
    id: number,
    value: boolean,
  ): Promise<ProductResponse> {
    const [product] = await db
      .update(productTable)
      .set({ isBestSeller: value, updatedAt: new Date() })
      .where(eq(productTable.id, id))
      .returning();

    if (!product) throw new Error("PRODUCT_NOT_FOUND");

    return buildProductResponse(id);
  }

  public async addImages(
    productId: number,
    data: CreateProductImage[],
  ): Promise<ProductImage[]> {
    if (data.length === 0) return [];

    const [productRows, countRows] = await db.batch([
      db
        .select({ id: productTable.id })
        .from(productTable)
        .where(eq(productTable.id, productId))
        .limit(1),
      db
        .select({ count: count() })
        .from(productImageTable)
        .where(eq(productImageTable.productId, productId)),
    ]);

    if (!productRows[0]) throw new Error("PRODUCT_NOT_FOUND");

    const currentCount = countRows[0]?.count ?? 0;
    if (currentCount + data.length > 5) {
      throw new Error("PRODUCT_IMAGES_LIMIT_EXCEEDED");
    }

    const hasMain = data.some((img) => img.isMain);
    if (hasMain) {
      await db
        .update(productImageTable)
        .set({ isMain: false })
        .where(eq(productImageTable.productId, productId));
    }

    const inserted = await db
      .insert(productImageTable)
      .values(
        data.map((img, index) => ({
          productId,
          url: img.url,
          publicId: img.publicId,
          order: img.order ?? currentCount + index,
          isMain: img.isMain ?? (currentCount === 0 && index === 0),
        })),
      )
      .returning();

    if (!inserted || inserted.length === 0)
      throw new Error("IMAGE_CREATE_FAILED");
    return inserted;
  }

  public async addImage(
    productId: number,
    data: CreateProductImage,
  ): Promise<ProductImage> {
    const [image] = await this.addImages(productId, [data]);
    if (!image) throw new Error("IMAGE_CREATE_FAILED");
    return image;
  }

  public async updateImage(
    productId: number,
    imageId: number,
    data: UpdateProductImage,
  ): Promise<ProductImage> {
    const [product] = await db
      .select({ id: productTable.id })
      .from(productTable)
      .where(eq(productTable.id, productId))
      .limit(1);

    if (!product) throw new Error("PRODUCT_NOT_FOUND");

    if (data.isMain) {
      await db
        .update(productImageTable)
        .set({ isMain: false })
        .where(eq(productImageTable.productId, productId));
    }

    const [updated] = await db
      .update(productImageTable)
      .set({ ...data })
      .where(
        and(
          eq(productImageTable.id, imageId),
          eq(productImageTable.productId, productId),
        ),
      )
      .returning();

    if (!updated) throw new Error("IMAGE_NOT_FOUND");
    return updated;
  }

  public async deleteImage(productId: number, imageId: number): Promise<void> {
    const [product] = await db
      .select({ id: productTable.id })
      .from(productTable)
      .where(eq(productTable.id, productId))
      .limit(1);

    if (!product) throw new Error("PRODUCT_NOT_FOUND");

    const [deleted] = await db
      .delete(productImageTable)
      .where(
        and(
          eq(productImageTable.id, imageId),
          eq(productImageTable.productId, productId),
        ),
      )
      .returning({ id: productImageTable.id });

    if (!deleted) throw new Error("IMAGE_NOT_FOUND");
  }

  public async setMainImage(
    productId: number,
    imageId: number,
  ): Promise<ProductImage> {
    const [product] = await db
      .select({ id: productTable.id })
      .from(productTable)
      .where(eq(productTable.id, productId))
      .limit(1);

    if (!product) throw new Error("PRODUCT_NOT_FOUND");

    await db
      .update(productImageTable)
      .set({ isMain: false })
      .where(eq(productImageTable.productId, productId));

    const [updated] = await db
      .update(productImageTable)
      .set({ isMain: true })
      .where(
        and(
          eq(productImageTable.id, imageId),
          eq(productImageTable.productId, productId),
        ),
      )
      .returning();

    if (!updated) throw new Error("IMAGE_NOT_FOUND");
    return updated;
  }

  public async reorderImages(
    productId: number,
    imageIds: number[],
  ): Promise<void> {
    const [product] = await db
      .select({ id: productTable.id })
      .from(productTable)
      .where(eq(productTable.id, productId))
      .limit(1);

    if (!product) throw new Error("PRODUCT_NOT_FOUND");

    const existingImages = await db
      .select({ id: productImageTable.id })
      .from(productImageTable)
      .where(eq(productImageTable.productId, productId));

    const existingIds = new Set(existingImages.map((img) => img.id));
    for (const imgId of imageIds) {
      if (!existingIds.has(imgId)) throw new Error("IMAGE_NOT_FOUND");
    }

    await Promise.all(
      imageIds.map((imgId, index) =>
        db
          .update(productImageTable)
          .set({ order: index })
          .where(
            and(
              eq(productImageTable.id, imgId),
              eq(productImageTable.productId, productId),
            ),
          ),
      ),
    );
  }

  public async addVariant(
    productId: number,
    data: CreateProductVariant,
  ): Promise<ProductVariant> {
    const [product] = await db
      .select({ id: productTable.id })
      .from(productTable)
      .where(eq(productTable.id, productId))
      .limit(1);

    if (!product) throw new Error("PRODUCT_NOT_FOUND");

    const [variant] = await db
      .insert(productVariantTable)
      .values({
        productId,
        size: data.size ?? null,
        weight: data.weight ?? null,
        isAvailable: data.isAvailable ?? true,
      })
      .returning();

    if (!variant) throw new Error("VARIANT_CREATE_FAILED");
    return variant;
  }

  public async updateVariant(
    productId: number,
    variantId: number,
    data: UpdateProductVariant,
  ): Promise<ProductVariant> {
    const [product] = await db
      .select({ id: productTable.id })
      .from(productTable)
      .where(eq(productTable.id, productId))
      .limit(1);

    if (!product) throw new Error("PRODUCT_NOT_FOUND");

    const [variant] = await db
      .update(productVariantTable)
      .set({ ...data })
      .where(
        and(
          eq(productVariantTable.id, variantId),
          eq(productVariantTable.productId, productId),
        ),
      )
      .returning();

    if (!variant) throw new Error("VARIANT_NOT_FOUND");
    return variant;
  }

  public async deleteVariant(
    productId: number,
    variantId: number,
  ): Promise<void> {
    const [product] = await db
      .select({ id: productTable.id })
      .from(productTable)
      .where(eq(productTable.id, productId))
      .limit(1);

    if (!product) throw new Error("PRODUCT_NOT_FOUND");

    const [deleted] = await db
      .delete(productVariantTable)
      .where(
        and(
          eq(productVariantTable.id, variantId),
          eq(productVariantTable.productId, productId),
        ),
      )
      .returning({ id: productVariantTable.id });

    if (!deleted) throw new Error("VARIANT_NOT_FOUND");
  }
}

export const productService = new ProductService();
