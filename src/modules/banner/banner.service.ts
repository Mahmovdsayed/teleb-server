import { asc, eq } from "drizzle-orm";
import { db } from "../../database";
import { bannerTable, type BannerImage } from "../../database/schemas";
import type {
  AddBannerImage,
  BannerResponse,
  CreateBanner,
  IBannerService,
  UpdateBanner,
  UpdateBannerImage,
} from "./banner.types";

class BannerService implements IBannerService {
  public async getAll(): Promise<BannerResponse[]> {
    return db
      .select()
      .from(bannerTable)
      .orderBy(asc(bannerTable.id));
  }

  public async getById(id: number): Promise<BannerResponse> {
    const [banner] = await db
      .select()
      .from(bannerTable)
      .where(eq(bannerTable.id, id))
      .limit(1);

    if (!banner) throw new Error("BANNER_NOT_FOUND");
    return banner;
  }

  public async create(data: CreateBanner, userId: number): Promise<BannerResponse> {
    const [banner] = await db
      .insert(bannerTable)
      .values({
        title: data.title,
        images: data.images ?? [],
        userId,
      })
      .returning();

    if (!banner) throw new Error("BANNER_CREATE_FAILED");
    return banner;
  }

  public async update(id: number, data: UpdateBanner): Promise<BannerResponse> {
    if (data.images !== undefined) {
      for (const img of data.images) {
        if (!img.url || !img.publicId || typeof img.order !== "number" || img.order < 0) {
          throw new Error("BANNER_UPDATE_FAILED");
        }
      }
    }

    const [banner] = await db
      .update(bannerTable)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(bannerTable.id, id))
      .returning();

    if (!banner) throw new Error("BANNER_NOT_FOUND");
    return banner;
  }

  public async delete(id: number): Promise<void> {
    const [deleted] = await db
      .delete(bannerTable)
      .where(eq(bannerTable.id, id))
      .returning({ id: bannerTable.id });

    if (!deleted) throw new Error("BANNER_NOT_FOUND");
  }

  public async addImage(
    bannerId: number,
    data: AddBannerImage,
  ): Promise<BannerResponse> {
    const [banner] = await db
      .select()
      .from(bannerTable)
      .where(eq(bannerTable.id, bannerId))
      .limit(1);

    if (!banner) throw new Error("BANNER_NOT_FOUND");

    const currentImages = banner.images ?? [];
    const nextOrder =
      currentImages.length > 0
        ? Math.max(...currentImages.map((img) => img.order)) + 1
        : 0;

    const newImage: BannerImage = {
      url: data.url,
      publicId: data.publicId,
      order: nextOrder,
    };

    const [updated] = await db
      .update(bannerTable)
      .set({
        images: [...currentImages, newImage],
        updatedAt: new Date(),
      })
      .where(eq(bannerTable.id, bannerId))
      .returning();

    if (!updated) throw new Error("IMAGE_CREATE_FAILED");
    return updated;
  }

  public async updateImage(
    bannerId: number,
    imageId: number,
    data: UpdateBannerImage,
  ): Promise<BannerResponse> {
    const [banner] = await db
      .select()
      .from(bannerTable)
      .where(eq(bannerTable.id, bannerId))
      .limit(1);

    if (!banner) throw new Error("BANNER_NOT_FOUND");

    const images = banner.images ?? [];
    if (imageId < 0 || imageId >= images.length) {
      throw new Error("IMAGE_NOT_FOUND");
    }

    const current = images[imageId];
    if (!current) {
      throw new Error("IMAGE_NOT_FOUND");
    }

    const updatedImage: BannerImage = {
      url: data.url ?? current.url,
      publicId: data.publicId ?? current.publicId,
      order: current.order,
    };

    const updatedImages = [...images];
    updatedImages[imageId] = updatedImage;

    const [updated] = await db
      .update(bannerTable)
      .set({
        images: updatedImages,
        updatedAt: new Date(),
      })
      .where(eq(bannerTable.id, bannerId))
      .returning();

    if (!updated) throw new Error("IMAGE_UPDATE_FAILED");
    return updated;
  }

  public async deleteImage(
    bannerId: number,
    imageId: number,
  ): Promise<BannerResponse> {
    const [banner] = await db
      .select()
      .from(bannerTable)
      .where(eq(bannerTable.id, bannerId))
      .limit(1);

    if (!banner) throw new Error("BANNER_NOT_FOUND");

    const images = banner.images ?? [];
    if (imageId < 0 || imageId >= images.length) {
      throw new Error("IMAGE_NOT_FOUND");
    }

    const filtered = images.filter((_, idx) => idx !== imageId);
    const normalizedImages: BannerImage[] = filtered.map((img, idx) => ({
      ...img,
      order: idx,
    }));

    const [updated] = await db
      .update(bannerTable)
      .set({
        images: normalizedImages,
        updatedAt: new Date(),
      })
      .where(eq(bannerTable.id, bannerId))
      .returning();

    if (!updated) throw new Error("IMAGE_DELETE_FAILED");
    return updated;
  }

  public async reorderImages(
    bannerId: number,
    imageIds: number[],
  ): Promise<BannerResponse> {
    return await db.transaction(async (tx) => {
      const [banner] = await tx
        .select()
        .from(bannerTable)
        .where(eq(bannerTable.id, bannerId))
        .limit(1);

      if (!banner) throw new Error("BANNER_NOT_FOUND");

      const images = banner.images ?? [];

      if (imageIds.length !== images.length) {
        throw new Error("INVALID_IMAGE_ORDER");
      }

      const seen = new Set<number>();
      for (const idx of imageIds) {
        if (idx < 0 || idx >= images.length) {
          throw new Error("IMAGE_NOT_FOUND");
        }
        if (seen.has(idx)) {
          throw new Error("INVALID_IMAGE_ORDER");
        }
        seen.add(idx);
      }

      const reordered: BannerImage[] = imageIds.map((idx, newOrder) => {
        const img = images[idx];
        if (!img) {
          throw new Error("IMAGE_NOT_FOUND");
        }
        return {
          url: img.url,
          publicId: img.publicId,
          order: newOrder,
        };
      });

      const [updated] = await tx
        .update(bannerTable)
        .set({
          images: reordered,
          updatedAt: new Date(),
        })
        .where(eq(bannerTable.id, bannerId))
        .returning();

      if (!updated) throw new Error("BANNER_NOT_FOUND");
      return updated;
    });
  }
}

export const bannerService = new BannerService();
