import { Hono } from "hono";
import type { AppEnv } from "../../types/app";
import { requireAuth } from "../../middleware/auth";
import { zValidate } from "../../middleware/validate";
import { adminRateLimiter } from "../../middleware/rate-limit";
import { cacheMiddleware } from "../../middleware/cache";
import {
  createProductSchema,
  updateProductSchema,
  productParamSchema,
  productSlugParamSchema,
  productQuerySchema,
  searchProductQuerySchema,
  updateStatusSchema,
  updateBestSellerSchema,
  createProductImageSchema,
  updateProductImageSchema,
  imageParamSchema,
  setMainImageSchema,
  reorderImagesSchema,
  createProductVariantSchema,
  updateProductVariantSchema,
  variantParamSchema,
} from "./product.schema";
import {
  getAllProductsController,
  searchProductsController,
  getProductByIdController,
  getProductBySlugController,
  createProductController,
  updateProductController,
  deleteProductController,
  updateProductStatusController,
  updateProductBestSellerController,
  addProductImageController,
  updateProductImageController,
  deleteProductImageController,
  setMainImageController,
  reorderImagesController,
  addProductVariantController,
  updateProductVariantController,
  deleteProductVariantController,
} from "./product.controller";

const productRoutes = new Hono<AppEnv>();

productRoutes.get("/", cacheMiddleware({ keyPrefix: "Products" }), zValidate("query", productQuerySchema), getAllProductsController);
productRoutes.get("/search", zValidate("query", searchProductQuerySchema), searchProductsController);
productRoutes.get("/slug/:slug", cacheMiddleware({ keyPrefix: "Products" }), zValidate("param", productSlugParamSchema), getProductBySlugController);
productRoutes.get("/:id", cacheMiddleware({ keyPrefix: "Products" }), zValidate("param", productParamSchema), getProductByIdController);
productRoutes.post("/create", requireAuth(), adminRateLimiter(), zValidate("json", createProductSchema), createProductController);
productRoutes.patch("/update/:id", requireAuth(), adminRateLimiter(), zValidate("param", productParamSchema), zValidate("json", updateProductSchema), updateProductController);
productRoutes.delete("/delete/:id", requireAuth(), adminRateLimiter(), zValidate("param", productParamSchema), deleteProductController);
productRoutes.patch("/status/:id", requireAuth(), adminRateLimiter(), zValidate("param", productParamSchema), zValidate("json", updateStatusSchema), updateProductStatusController);
productRoutes.patch("/best-seller/:id", requireAuth(), adminRateLimiter(), zValidate("param", productParamSchema), zValidate("json", updateBestSellerSchema), updateProductBestSellerController);
productRoutes.post("/images/:id", requireAuth(), adminRateLimiter(), zValidate("param", productParamSchema), zValidate("json", createProductImageSchema), addProductImageController);
productRoutes.patch("/images/main/:id", requireAuth(), adminRateLimiter(), zValidate("param", productParamSchema), zValidate("json", setMainImageSchema), setMainImageController);
productRoutes.patch("/images/reorder/:id", requireAuth(), adminRateLimiter(), zValidate("param", productParamSchema), zValidate("json", reorderImagesSchema), reorderImagesController);
productRoutes.patch("/images/update/:id/:imageId", requireAuth(), adminRateLimiter(), zValidate("param", imageParamSchema), zValidate("json", updateProductImageSchema), updateProductImageController);
productRoutes.delete("/images/delete/:id/:imageId", requireAuth(), adminRateLimiter(), zValidate("param", imageParamSchema), deleteProductImageController);
productRoutes.post("/variants/:id", requireAuth(), adminRateLimiter(), zValidate("param", productParamSchema), zValidate("json", createProductVariantSchema), addProductVariantController);
productRoutes.patch("/variants/update/:id/:variantId", requireAuth(), adminRateLimiter(), zValidate("param", variantParamSchema), zValidate("json", updateProductVariantSchema), updateProductVariantController);
productRoutes.delete("/variants/delete/:id/:variantId", requireAuth(), adminRateLimiter(), zValidate("param", variantParamSchema), deleteProductVariantController);

export default productRoutes;
