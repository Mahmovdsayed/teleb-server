import { t } from "../../i18n";
import type { AppContext } from "../../types/http";
import type { ParamRequest } from "../../validation/global/param.validation";
import type { CreateCollectionInput, UpdateCollectionInput } from "./collection.schemas";
import { collection } from "./collection.service";

type CreateCollection = AppContext<{ out: {json: CreateCollectionInput} }>;
type UpdateCollection = AppContext<{ out: { json: UpdateCollectionInput; param: ParamRequest }}>;

export const createCollectionController = async (c: CreateCollection) => {
  try {
    const { id } = c.get("user");
    const input = c.req.valid("json");

    const newCollection = await collection.create(input, id);

    return c.json({
        success: true,
        message: t(c, "collection.created"),
        data: newCollection,
      });
  } catch (error) {
    if ( error instanceof Error && error.message === "COLLECTION_CREATE_FAILED") return c.json({success: false, message: t(c, "collection.createFailed")});
    return c.json({success: false, message: t(c, "common.internalServerError")});
  }
};

export const updateCollectionController = async (c: UpdateCollection) => {
  try {
    const user = c.get("user");
    const input = c.req.valid("json");
    const { id } = c.req.valid("param");

    const updatedCollection = await collection.update(input, id, user.id);

    return c.json({
      success: true,
      message: t(c, "collection.updated"),
      data: updatedCollection,
    });

  } catch (error) {
    if (error instanceof Error && error.message === "COLLECTION_NOT_FOUND") return c.json({success: false, message: t(c, "collection.notFound")});
    if (error instanceof Error && error.message === "COLLECTION_UPDATE_FAILED") return c.json({success: false, message: t(c, "collection.updateFailed")});
    return c.json({success: false, message: t(c, "common.internalServerError")});
  }
};
