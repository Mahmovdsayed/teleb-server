import { t } from "../../i18n";
import { invalidateCache } from "../../middleware/cache";
import type { AppContext } from "../../types/http";
import { productService } from "./product.service";
import type {
  CreateProductInput,
  UpdateProductInput,
  ProductParamInput,
  ProductSlugParamInput,
  ProductQueryInput,
  SearchProductQueryInput,
  UpdateStatusInput,
  UpdateBestSellerInput,
  CreateProductImageInput,
  UpdateProductImageInput,
  ImageParamInput,
  SetMainImageInput,
  ReorderImagesInput,
  CreateProductVariantInput,
  UpdateProductVariantInput,
  VariantParamInput,
} from "./product.schema";
import type {
  GetProductsOptions,
  SearchProductOptions,
  CreateProduct,
  UpdateProduct,
  CreateProductImage,
  UpdateProductImage,
  CreateProductVariant,
  UpdateProductVariant,
} from "./product.types";


type GetProductsCtx = AppContext<{ out: { query: ProductQueryInput } }>;
type SearchProductsCtx = AppContext<{ out: { query: SearchProductQueryInput } }>;
type GetProductByIdCtx = AppContext<{ out: { param: ProductParamInput } }>;
type GetProductBySlugCtx = AppContext<{ out: { param: ProductSlugParamInput } }>;
type CreateProductCtx = AppContext<{ out: { json: CreateProductInput } }>;
type UpdateProductCtx = AppContext<{ out: { json: UpdateProductInput; param: ProductParamInput } }>;
type DeleteProductCtx = AppContext<{ out: { param: ProductParamInput } }>;
type UpdateStatusCtx = AppContext<{ out: { json: UpdateStatusInput; param: ProductParamInput } }>;
type UpdateBestSellerCtx = AppContext<{ out: { json: UpdateBestSellerInput; param: ProductParamInput } }>;
type AddImageCtx = AppContext<{ out: { json: CreateProductImageInput; param: ProductParamInput } }>;
type UpdateImageCtx = AppContext<{ out: { json: UpdateProductImageInput; param: ImageParamInput } }>;
type DeleteImageCtx = AppContext<{ out: { param: ImageParamInput } }>;
type SetMainImageCtx = AppContext<{ out: { json: SetMainImageInput; param: ProductParamInput } }>;
type ReorderImagesCtx = AppContext<{ out: { json: ReorderImagesInput; param: ProductParamInput } }>;
type AddVariantCtx = AppContext<{ out: { json: CreateProductVariantInput; param: ProductParamInput } }>;
type UpdateVariantCtx = AppContext<{ out: { json: UpdateProductVariantInput; param: VariantParamInput } }>;
type DeleteVariantCtx = AppContext<{ out: { param: VariantParamInput } }>;

const PRODUCT_CACHE_KEY = "Products";

// GET ALL
export const getAllProductsController = async (c: GetProductsCtx) => {
  try {
    const query = c.req.valid("query");
    const locale = c.get("lang");
    const result = await productService.getAll(query as GetProductsOptions, locale);
    return c.json({ success: true, data: result.data, total: result.total });
  } catch {
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

// SEARCH
export const searchProductsController = async (c: SearchProductsCtx) => {
  try {
    const query = c.req.valid("query");
    const locale = c.get("lang");
    const result = await productService.search(query as SearchProductOptions, locale);
    return c.json({ success: true, data: result.data, total: result.total });
  } catch {
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

// GET BY ID
export const getProductByIdController = async (c: GetProductByIdCtx) => {
  try {
    const { id } = c.req.valid("param");
    const locale = c.get("lang");
    const product = await productService.getById(id, locale);
    return c.json({ success: true, data: product });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND")
      return c.json({ success: false, message: t(c, "product.notFound") });
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

// GET BY SLUG
export const getProductBySlugController = async (c: GetProductBySlugCtx) => {
  try {
    const { slug } = c.req.valid("param");
    const locale = c.get("lang");
    const product = await productService.getBySlug(slug, locale);
    return c.json({ success: true, data: product });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND")
      return c.json({ success: false, message: t(c, "product.notFound") });
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

// CREATE
export const createProductController = async (c: CreateProductCtx) => {
  try {
    const { id } = c.get("user");
    const input = c.req.valid("json");
    const product = await productService.create(input as CreateProduct, id);
    await invalidateCache(PRODUCT_CACHE_KEY);
    return c.json({ success: true, message: t(c, "product.created"), data: product });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_SLUG_ALREADY_EXISTS")
      return c.json({ success: false, message: t(c, "product.slugAlreadyExists") });
    if (error instanceof Error && error.message === "PRODUCT_CREATE_FAILED")
      return c.json({ success: false, message: t(c, "product.createFailed") });
    if (error instanceof Error && error.message === "COLLECTION_NOT_FOUND")
      return c.json({ success: false, message: t(c, "collection.notFound") });
    console.error("createProductController error:", error);
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

// UPDATE
export const updateProductController = async (c: UpdateProductCtx) => {
  try {
    const { id } = c.req.valid("param");
    const input = c.req.valid("json");
    const product = await productService.update(id, input as UpdateProduct);
    await invalidateCache(PRODUCT_CACHE_KEY);
    return c.json({ success: true, message: t(c, "product.updated"), data: product });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND")
      return c.json({ success: false, message: t(c, "product.notFound") });
    if (error instanceof Error && error.message === "PRODUCT_SLUG_ALREADY_EXISTS")
      return c.json({ success: false, message: t(c, "product.slugAlreadyExists") });
    if (error instanceof Error && error.message === "COLLECTION_NOT_FOUND")
      return c.json({ success: false, message: t(c, "collection.notFound") });
    console.error("updateProductController error:", error);
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

// DELETE
export const deleteProductController = async (c: DeleteProductCtx) => {
  try {
    const { id } = c.req.valid("param");
    await productService.delete(id);
    await invalidateCache(PRODUCT_CACHE_KEY);
    return c.json({ success: true, message: t(c, "product.deleted") });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND")
      return c.json({ success: false, message: t(c, "product.notFound") });
    return c.json({ success: false, message: t(c, "product.deleteFailed") });
  }
};

// UPDATE STATUS
export const updateProductStatusController = async (c: UpdateStatusCtx) => {
  try {
    const { id } = c.req.valid("param");
    const { status } = c.req.valid("json");
    const product = await productService.updateStatus(id, status);
    await invalidateCache(PRODUCT_CACHE_KEY);
    return c.json({ success: true, message: t(c, "product.statusUpdated"), data: product });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND")
      return c.json({ success: false, message: t(c, "product.notFound") });
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

// UPDATE BEST SELLER
export const updateProductBestSellerController = async (c: UpdateBestSellerCtx) => {
  try {
    const { id } = c.req.valid("param");
    const { value } = c.req.valid("json");
    const product = await productService.updateBestSeller(id, value);
    await invalidateCache(PRODUCT_CACHE_KEY);
    return c.json({ success: true, message: t(c, "product.bestSellerUpdated"), data: product });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND")
      return c.json({ success: false, message: t(c, "product.notFound") });
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

// ADD IMAGE
export const addProductImageController = async (c: AddImageCtx) => {
  try {
    const { id } = c.req.valid("param");
    const input = c.req.valid("json");
    const isBulk =
      Array.isArray(input) ||
      ("images" in input && Array.isArray((input as { images: unknown }).images));

    const imagesToInsert: CreateProductImage[] = Array.isArray(input)
      ? (input as CreateProductImage[])
      : "images" in input && Array.isArray((input as { images: unknown }).images)
        ? ((input as { images: CreateProductImage[] }).images)
        : [input as CreateProductImage];

    const images = await productService.addImages(id, imagesToInsert);
    await invalidateCache(PRODUCT_CACHE_KEY);
    return c.json({
      success: true,
      message: t(c, "product.imageAdded"),
      data: isBulk ? images : images[0],
    });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND")
      return c.json({ success: false, message: t(c, "product.notFound") });
    if (error instanceof Error && error.message === "IMAGE_CREATE_FAILED")
      return c.json({ success: false, message: t(c, "product.imageCreateFailed") });
    if (error instanceof Error && error.message === "PRODUCT_IMAGES_LIMIT_EXCEEDED")
      return c.json({ success: false, message: t(c, "product.imagesLimitExceeded") });
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

// UPDATE IMAGE
export const updateProductImageController = async (c: UpdateImageCtx) => {
  try {
    const { id, imageId } = c.req.valid("param");
    const input = c.req.valid("json");
    const image = await productService.updateImage(id, imageId, input as UpdateProductImage);
    await invalidateCache(PRODUCT_CACHE_KEY);
    return c.json({ success: true, message: t(c, "product.imageUpdated"), data: image });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND")
      return c.json({ success: false, message: t(c, "product.notFound") });
    if (error instanceof Error && error.message === "IMAGE_NOT_FOUND")
      return c.json({ success: false, message: t(c, "product.imageNotFound") });
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

// DELETE IMAGE
export const deleteProductImageController = async (c: DeleteImageCtx) => {
  try {
    const { id, imageId } = c.req.valid("param");
    await productService.deleteImage(id, imageId);
    await invalidateCache(PRODUCT_CACHE_KEY);
    return c.json({ success: true, message: t(c, "product.imageDeleted") });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND")
      return c.json({ success: false, message: t(c, "product.notFound") });
    if (error instanceof Error && error.message === "IMAGE_NOT_FOUND")
      return c.json({ success: false, message: t(c, "product.imageNotFound") });
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

// SET MAIN IMAGE
export const setMainImageController = async (c: SetMainImageCtx) => {
  try {
    const { id } = c.req.valid("param");
    const { imageId } = c.req.valid("json");
    const image = await productService.setMainImage(id, imageId);
    await invalidateCache(PRODUCT_CACHE_KEY);
    return c.json({ success: true, message: t(c, "product.mainImageSet"), data: image });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND")
      return c.json({ success: false, message: t(c, "product.notFound") });
    if (error instanceof Error && error.message === "IMAGE_NOT_FOUND")
      return c.json({ success: false, message: t(c, "product.imageNotFound") });
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

// REORDER IMAGES
export const reorderImagesController = async (c: ReorderImagesCtx) => {
  try {
    const { id } = c.req.valid("param");
    const { imageIds } = c.req.valid("json");
    await productService.reorderImages(id, imageIds);
    await invalidateCache(PRODUCT_CACHE_KEY);
    return c.json({ success: true, message: t(c, "product.imagesReordered") });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND")
      return c.json({ success: false, message: t(c, "product.notFound") });
    if (error instanceof Error && error.message === "IMAGE_NOT_FOUND")
      return c.json({ success: false, message: t(c, "product.imageNotFound") });
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

// ADD VARIANT
export const addProductVariantController = async (c: AddVariantCtx) => {
  try {
    const { id } = c.req.valid("param");
    const input = c.req.valid("json");
    const variant = await productService.addVariant(id, input as CreateProductVariant);
    await invalidateCache(PRODUCT_CACHE_KEY);
    return c.json({ success: true, message: t(c, "product.variantAdded"), data: variant });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND")
      return c.json({ success: false, message: t(c, "product.notFound") });
    if (error instanceof Error && error.message === "VARIANT_CREATE_FAILED")
      return c.json({ success: false, message: t(c, "product.variantCreateFailed") });
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

// UPDATE VARIANT
export const updateProductVariantController = async (c: UpdateVariantCtx) => {
  try {
    const { id, variantId } = c.req.valid("param");
    const input = c.req.valid("json");
    const variant = await productService.updateVariant(id, variantId, input as UpdateProductVariant);
    await invalidateCache(PRODUCT_CACHE_KEY);
    return c.json({ success: true, message: t(c, "product.variantUpdated"), data: variant });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND")
      return c.json({ success: false, message: t(c, "product.notFound") });
    if (error instanceof Error && error.message === "VARIANT_NOT_FOUND")
      return c.json({ success: false, message: t(c, "product.variantNotFound") });
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

// DELETE VARIANT
export const deleteProductVariantController = async (c: DeleteVariantCtx) => {
  try {
    const { id, variantId } = c.req.valid("param");
    await productService.deleteVariant(id, variantId);
    await invalidateCache(PRODUCT_CACHE_KEY);
    return c.json({ success: true, message: t(c, "product.variantDeleted") });
  } catch (error) {
    if (error instanceof Error && error.message === "PRODUCT_NOT_FOUND")
      return c.json({ success: false, message: t(c, "product.notFound") });
    if (error instanceof Error && error.message === "VARIANT_NOT_FOUND")
      return c.json({ success: false, message: t(c, "product.variantNotFound") });
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};
