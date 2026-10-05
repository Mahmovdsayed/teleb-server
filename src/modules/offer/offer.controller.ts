import { t } from "../../i18n";
import { invalidateCache } from "../../middleware/cache";
import type { AppContext } from "../../types/http";
import { offerService } from "./offer.service";
import type {
  CreateOfferInput,
  OfferParamInput,
  OfferQueryInput,
  UpdateOfferInput,
  UpdateOfferShowBannerInput,
  UpdateOfferStatusInput,
} from "./offer.schema";

type GetOffersCtx = AppContext<{ out: { query: OfferQueryInput } }>;
type GetOfferByIdCtx = AppContext<{ out: { param: OfferParamInput } }>;
type GetCurrentBannerOfferCtx = AppContext;
type CreateOfferCtx = AppContext<{ out: { json: CreateOfferInput } }>;
type UpdateOfferCtx = AppContext<{ out: { json: UpdateOfferInput; param: OfferParamInput } }>;
type DeleteOfferCtx = AppContext<{ out: { param: OfferParamInput } }>;
type UpdateOfferStatusCtx = AppContext<{ out: { json: UpdateOfferStatusInput; param: OfferParamInput } }>;
type UpdateOfferShowBannerCtx = AppContext<{ out: { json: UpdateOfferShowBannerInput; param: OfferParamInput } }>;

const OFFER_CACHE_KEY = "Offers";

export const getAllOffersController = async (c: GetOffersCtx) => {
  try {
    const query = c.req.valid("query");
    const result = await offerService.getAll(query);
    return c.json({ success: true, data: result.data, total: result.total });
  } catch {
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

export const getOfferByIdController = async (c: GetOfferByIdCtx) => {
  try {
    const { id } = c.req.valid("param");
    const offer = await offerService.getById(id);
    return c.json({ success: true, data: offer });
  } catch (error) {
    if (error instanceof Error && error.message === "OFFER_NOT_FOUND") {
      return c.json({ success: false, message: t(c, "offer.notFound") });
    }
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

export const getCurrentBannerOfferController = async (c: GetCurrentBannerOfferCtx) => {
  try {
    const offer = await offerService.getCurrentBannerOffer();
    return c.json({ success: true, data: offer });
  } catch {
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

export const createOfferController = async (c: CreateOfferCtx) => {
  try {
    const { id: userId } = c.get("user");
    const input = c.req.valid("json");
    const offer = await offerService.create(input, userId);
    await invalidateCache(OFFER_CACHE_KEY);
    return c.json({
      success: true,
      message: t(c, "offer.created"),
      data: offer,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "OFFER_BANNER_ALREADY_EXISTS") {
      return c.json({ success: false, message: t(c, "offer.bannerAlreadyExists") });
    }
    if (error instanceof Error && error.message === "INVALID_OFFER_DATES") {
      return c.json({ success: false, message: t(c, "offer.invalidDates") });
    }
    if (error instanceof Error && error.message === "INVALID_OFFER_PERCENTAGE") {
      return c.json({ success: false, message: t(c, "offer.invalidPercentage") });
    }
    if (error instanceof Error && error.message === "OFFER_CREATE_FAILED") {
      return c.json({ success: false, message: t(c, "offer.createFailed") });
    }
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

export const updateOfferController = async (c: UpdateOfferCtx) => {
  try {
    const { id } = c.req.valid("param");
    const input = c.req.valid("json");
    const offer = await offerService.update(id, input);
    await invalidateCache(OFFER_CACHE_KEY);
    return c.json({
      success: true,
      message: t(c, "offer.updated"),
      data: offer,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "OFFER_NOT_FOUND") {
      return c.json({ success: false, message: t(c, "offer.notFound") });
    }
    if (error instanceof Error && error.message === "OFFER_BANNER_ALREADY_EXISTS") {
      return c.json({ success: false, message: t(c, "offer.bannerAlreadyExists") });
    }
    if (error instanceof Error && error.message === "INVALID_OFFER_DATES") {
      return c.json({ success: false, message: t(c, "offer.invalidDates") });
    }
    if (error instanceof Error && error.message === "INVALID_OFFER_PERCENTAGE") {
      return c.json({ success: false, message: t(c, "offer.invalidPercentage") });
    }
    if (error instanceof Error && error.message === "OFFER_UPDATE_FAILED") {
      return c.json({ success: false, message: t(c, "offer.updateFailed") });
    }
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

export const deleteOfferController = async (c: DeleteOfferCtx) => {
  try {
    const { id } = c.req.valid("param");
    await offerService.delete(id);
    await invalidateCache(OFFER_CACHE_KEY);
    return c.json({ success: true, message: t(c, "offer.deleted") });
  } catch (error) {
    if (error instanceof Error && error.message === "OFFER_NOT_FOUND") {
      return c.json({ success: false, message: t(c, "offer.notFound") });
    }
    if (error instanceof Error && error.message === "OFFER_DELETE_FAILED") {
      return c.json({ success: false, message: t(c, "offer.deleteFailed") });
    }
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

export const updateOfferStatusController = async (c: UpdateOfferStatusCtx) => {
  try {
    const { id } = c.req.valid("param");
    const input = c.req.valid("json");
    const value = input.value ?? input.isActive ?? false;
    const offer = await offerService.updateStatus(id, value);
    await invalidateCache(OFFER_CACHE_KEY);
    return c.json({
      success: true,
      message: t(c, "offer.statusUpdated"),
      data: offer,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "OFFER_NOT_FOUND") {
      return c.json({ success: false, message: t(c, "offer.notFound") });
    }
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};

export const updateOfferShowBannerController = async (c: UpdateOfferShowBannerCtx) => {
  try {
    const { id } = c.req.valid("param");
    const input = c.req.valid("json");
    const value = input.value ?? input.showBanner ?? false;
    const offer = await offerService.updateShowBanner(id, value);
    await invalidateCache(OFFER_CACHE_KEY);
    return c.json({
      success: true,
      message: t(c, "offer.bannerUpdated"),
      data: offer,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "OFFER_NOT_FOUND") {
      return c.json({ success: false, message: t(c, "offer.notFound") });
    }
    if (error instanceof Error && error.message === "OFFER_BANNER_ALREADY_EXISTS") {
      return c.json({ success: false, message: t(c, "offer.bannerAlreadyExists") });
    }
    return c.json({ success: false, message: t(c, "common.internalServerError") });
  }
};
