import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { bannerTable, type BannerImage } from "../../database/schemas";

export type Banner = InferSelectModel<typeof bannerTable>;
export type NewBanner = InferInsertModel<typeof bannerTable>;
export type { BannerImage };

export interface BannerResponse {
  id: number;
  title: string;
  images: BannerImage[];
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBanner {
  title: string;
  images?: BannerImage[] | undefined;
}

export interface UpdateBanner {
  title?: string | undefined;
  images?: BannerImage[] | undefined;
}

export interface AddBannerImage {
  url: string;
  publicId: string;
}

export interface UpdateBannerImage {
  url?: string | undefined;
  publicId?: string | undefined;
}

export interface IBannerService {
  getAll(): Promise<BannerResponse[]>;
  getById(id: number): Promise<BannerResponse>;
  create(data: CreateBanner, userId: number): Promise<BannerResponse>;
  update(id: number, data: UpdateBanner): Promise<BannerResponse>;
  delete(id: number): Promise<void>;
  addImage(bannerId: number, data: AddBannerImage): Promise<BannerResponse>;
  updateImage(bannerId: number, imageId: number, data: UpdateBannerImage): Promise<BannerResponse>;
  deleteImage(bannerId: number, imageId: number): Promise<BannerResponse>;
  reorderImages(bannerId: number, imageIds: number[]): Promise<BannerResponse>;
}
