import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import type { productImageTable, productTable, productTranslationTable, productVariantTable } from "../../database/schemas";

export type Product = InferSelectModel<typeof productTable>;
export type NewProduct = InferInsertModel<typeof productTable>;
export type ProductTranslation = InferSelectModel<typeof productTranslationTable>;
export type ProductImage = InferSelectModel<typeof productImageTable>;
export type ProductVariant = InferSelectModel<typeof productVariantTable>;

export type Locale = "ar" | "en";

export interface ProductWithRelations extends Product {
  translations: ProductTranslation[];
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface ProductResponse {
  id: number;
  slug: string;
  status: "active" | "inactive";
  isBestSeller: boolean;
  isCustomizable: boolean;
  warranty: number;
  weight: string | null;
  translation: ProductTranslation | null;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface CreateProduct {
  collectionId: number;
  offerId?: number | null;
  slug: string;
  status?: "active" | "inactive";
  isBestSeller?: boolean;
  isFreeShipping?: boolean;
  isCustomizable?: boolean;
  warranty?: number;
  weight?: string | null;
  translations: {
    ar: CreateProductTranslation;
    en: CreateProductTranslation;
  };
  variants?: CreateProductVariant[];
}

export interface UpdateProduct {
  collectionId?: number;
  offerId?: number | null;
  slug?: string;
  status?: "active" | "inactive";
  isBestSeller?: boolean;
  isFreeShipping?: boolean;
  isCustomizable?: boolean;
  warranty?: number;
  weight?: string | null;
  translations?: {
    ar?: UpdateProductTranslation;
    en?: UpdateProductTranslation;
  };
  variants?: CreateProductVariant[];
}

export interface CreateProductTranslation {
  name: string;
  description?: string;
  smallDescription?: string;
  materials?: {
    name: string;
  }[];
  features?: {
    name: string;
  }[];
  height?: string | null;
  width?: string | null;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
}

export type UpdateProductTranslation = Partial<CreateProductTranslation>;

export interface CreateProductVariant {
  size?: string;
  weight?: string | null;
  isAvailable?: boolean;
}

export type UpdateProductVariant = Partial<CreateProductVariant>;

export interface GetProductsOptions {
  page: number;
  limit: number;
  collectionId?: number;
  offerId?: number;
  status?: "active" | "inactive";
  bestSeller?: boolean;
  search?: string;
  tag?: string;
  sort?: "createdAt" | "name";
  order?: "asc" | "desc";
}

export interface CreateProductImage {
  url: string;
  publicId: string;
  order?: number;
  isMain?: boolean;
}

export interface UpdateProductImage {
  url?: string;
  publicId?: string;
  order?: number;
  isMain?: boolean;
}

export interface IProductService {
  getAll(options: GetProductsOptions , local: string): Promise<{data: ProductResponse[]; total: number}>;
  getById(id: number): Promise<ProductResponse | null>;
  getBySlug(slug: string): Promise<ProductResponse | null>;
  create(data: CreateProduct, userId: number): Promise<ProductResponse>;
  update(id: number, data: UpdateProduct): Promise<ProductResponse>;
  delete(id: number): Promise<void>;
  updateStatus(id: number, status: "active" | "inactive"): Promise<ProductResponse>;
  updateBestSeller(id: number, value: boolean): Promise<ProductResponse>;
  addImage(productId: number, data: CreateProductImage): Promise<ProductImage>;
  updateImage(productId: number, imageId: number, data: UpdateProductImage): Promise<ProductImage>;
  deleteImage(productId: number, imageId: number): Promise<void>;
  setMainImage(productId: number, imageId: number): Promise<ProductImage>;
  reorderImages(productId: number, imageIds: number[]): Promise<void>;
  addVariant(productId: number, data: CreateProductVariant): Promise<ProductVariant>;
  updateVariant(productId: number, variantId: number, data: UpdateProductVariant): Promise<ProductVariant>;
  deleteVariant(productId: number, variantId: number): Promise<void>;
}