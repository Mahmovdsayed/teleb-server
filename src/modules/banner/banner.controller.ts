import { t } from "../../i18n";
import { invalidateCache } from "../../middleware/cache";
import type { AppContext } from "../../types/http";
import { bannerService } from "./banner.service";
import type {
  AddBannerImageInput,
  BannerImageParamInput,
  BannerParamInput,
  CreateBannerInput,
  ReorderBannerImagesInput,
  UpdateBannerImageInput,
  UpdateBannerInput,
} from "./banner.schema";

type GetAllBannersCtx = AppContext;
type GetBannerByIdCtx = AppContext<{ out: { param: BannerParamInput } }>;
type CreateBannerCtx = AppContext<{ out: { json: CreateBannerInput } }>;
type UpdateBannerCtx = AppContext<{ out: { json: UpdateBannerInput; param: BannerParamInput } }>;
type DeleteBannerCtx = AppContext<{ out: { param: BannerParamInput } }>;
type AddBannerImageCtx = AppContext<{ out: { json: AddBannerImageInput; param: BannerParamInput } }>;
type UpdateBannerImageCtx = AppContext<{ out: { json: UpdateBannerImageInput; param: BannerImageParamInput } }>;
type DeleteBannerImageCtx = AppContext<{ out: { param: BannerImageParamInput } }>;
type ReorderBannerImagesCtx = AppContext<{ out: { json: ReorderBannerImagesInput; param: BannerParamInput } }>;

const BANNER_CACHE_KEY = "Banners";

export const getAllBannersController = async (c: GetAllBannersCtx) => {
  try {
    const banners = await bannerService.getAll();
    return c.json({ success: true, data: banners });
  } catch {
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

export const getBannerByIdController = async (c: GetBannerByIdCtx) => {
  try {
    const { id } = c.req.valid("param");
    const banner = await bannerService.getById(id);
    return c.json({ success: true, data: banner });
  } catch (error) {
    if (error instanceof Error && error.message === "BANNER_NOT_FOUND") {
      return c.json({ success: false, message: t(c, "banner.notFound") });
    }
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

export const createBannerController = async (c: CreateBannerCtx) => {
  try {
    const { id: userId } = c.get("user");
    const input = c.req.valid("json");
    const banner = await bannerService.create(input, userId);
    await invalidateCache(BANNER_CACHE_KEY);
    return c.json({
      success: true,
      message: t(c, "banner.created"),
      data: banner,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "BANNER_CREATE_FAILED") {
      return c.json({ success: false, message: t(c, "banner.createFailed") });
    }
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

export const updateBannerController = async (c: UpdateBannerCtx) => {
  try {
    const { id } = c.req.valid("param");
    const input = c.req.valid("json");
    const banner = await bannerService.update(id, input);
    await invalidateCache(BANNER_CACHE_KEY);
    return c.json({
      success: true,
      message: t(c, "banner.updated"),
      data: banner,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "BANNER_NOT_FOUND") {
      return c.json({ success: false, message: t(c, "banner.notFound") });
    }
    if (error instanceof Error && error.message === "BANNER_UPDATE_FAILED") {
      return c.json({ success: false, message: t(c, "banner.updateFailed") });
    }
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

export const deleteBannerController = async (c: DeleteBannerCtx) => {
  try {
    const { id } = c.req.valid("param");
    await bannerService.delete(id);
    await invalidateCache(BANNER_CACHE_KEY);
    return c.json({ success: true, message: t(c, "banner.deleted") });
  } catch (error) {
    if (error instanceof Error && error.message === "BANNER_NOT_FOUND") {
      return c.json({ success: false, message: t(c, "banner.notFound") });
    }
    if (error instanceof Error && error.message === "BANNER_DELETE_FAILED") {
      return c.json({ success: false, message: t(c, "banner.deleteFailed") });
    }
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

export const addBannerImageController = async (c: AddBannerImageCtx) => {
  try {
    const { id } = c.req.valid("param");
    const input = c.req.valid("json");
    const banner = await bannerService.addImage(id, input);
    await invalidateCache(BANNER_CACHE_KEY);
    return c.json({
      success: true,
      message: t(c, "banner.imageAdded"),
      data: banner,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "BANNER_NOT_FOUND") {
      return c.json({ success: false, message: t(c, "banner.notFound") });
    }
    if (error instanceof Error && error.message === "IMAGE_CREATE_FAILED") {
      return c.json({ success: false, message: t(c, "banner.imageCreateFailed") });
    }
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

export const updateBannerImageController = async (c: UpdateBannerImageCtx) => {
  try {
    const { id, imageId } = c.req.valid("param");
    const input = c.req.valid("json");
    const banner = await bannerService.updateImage(id, imageId, input);
    await invalidateCache(BANNER_CACHE_KEY);
    return c.json({
      success: true,
      message: t(c, "banner.imageUpdated"),
      data: banner,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "BANNER_NOT_FOUND") {
      return c.json({ success: false, message: t(c, "banner.notFound") });
    }
    if (error instanceof Error && error.message === "IMAGE_NOT_FOUND") {
      return c.json({ success: false, message: t(c, "banner.imageNotFound") });
    }
    if (error instanceof Error && error.message === "IMAGE_UPDATE_FAILED") {
      return c.json({ success: false, message: t(c, "banner.imageUpdateFailed") });
    }
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

export const deleteBannerImageController = async (c: DeleteBannerImageCtx) => {
  try {
    const { id, imageId } = c.req.valid("param");
    const banner = await bannerService.deleteImage(id, imageId);
    await invalidateCache(BANNER_CACHE_KEY);
    return c.json({
      success: true,
      message: t(c, "banner.imageDeleted"),
      data: banner,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "BANNER_NOT_FOUND") {
      return c.json({ success: false, message: t(c, "banner.notFound") });
    }
    if (error instanceof Error && error.message === "IMAGE_NOT_FOUND") {
      return c.json({ success: false, message: t(c, "banner.imageNotFound") });
    }
    if (error instanceof Error && error.message === "IMAGE_DELETE_FAILED") {
      return c.json({ success: false, message: t(c, "banner.imageDeleteFailed") });
    }
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

export const reorderBannerImagesController = async (
  c: ReorderBannerImagesCtx,
) => {
  try {
    const { id } = c.req.valid("param");
    const { imageIds } = c.req.valid("json");
    const banner = await bannerService.reorderImages(id, imageIds);
    await invalidateCache(BANNER_CACHE_KEY);
    return c.json({
      success: true,
      message: t(c, "banner.imagesReordered"),
      data: banner,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "BANNER_NOT_FOUND") {
      return c.json({ success: false, message: t(c, "banner.notFound") });
    }
    if (error instanceof Error && error.message === "IMAGE_NOT_FOUND") {
      return c.json({ success: false, message: t(c, "banner.imageNotFound") });
    }
    if (error instanceof Error && error.message === "INVALID_IMAGE_ORDER") {
      return c.json({ success: false, message: t(c, "banner.invalidImageOrder") });
    }
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};
