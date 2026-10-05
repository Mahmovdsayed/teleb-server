import { and, asc, count, desc, eq, gte, lte, ne } from "drizzle-orm";
import { db } from "../../database";
import { offerTable } from "../../database/schemas";
import type {
  CreateOffer,
  GetOffersOptions,
  IOfferService,
  OfferResponse,
  UpdateOffer,
} from "./offer.types";

function isUniqueConstraintError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; message?: string; constraint?: string };
  return (
    err.code === "23505" ||
    err.constraint === "offers_one_banner_idx" ||
    (typeof err.message === "string" &&
      (err.message.includes("23505") ||
        err.message.includes("offers_one_banner_idx")))
  );
}

class OfferService implements IOfferService {
  public async getAll(options: GetOffersOptions): Promise<{
    data: OfferResponse[];
    total: number;
  }> {
    const {
      page = 1,
      limit = 10,
      isActive,
      showBanner,
      sort = "createdAt",
      order = "desc",
    } = options;

    const offset = (page - 1) * limit;
    const conditions = [];

    if (isActive !== undefined) {
      conditions.push(eq(offerTable.isActive, isActive));
    }
    if (showBanner !== undefined) {
      conditions.push(eq(offerTable.showBanner, showBanner));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const sortColumns = {
      createdAt: offerTable.createdAt,
      startDate: offerTable.startDate,
      endDate: offerTable.endDate,
      percentage: offerTable.percentage,
    };

    const selectedColumn =
      sort && sortColumns[sort] ? sortColumns[sort] : offerTable.createdAt;
    const orderBy =
      order === "asc" ? asc(selectedColumn) : desc(selectedColumn);

    const [offers, countResult] = await db.batch([
      db
        .select()
        .from(offerTable)
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),

      db.select({ count: count() }).from(offerTable).where(where),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    return { data: offers, total };
  }

  public async getById(id: number): Promise<OfferResponse> {
    const [offer] = await db
      .select()
      .from(offerTable)
      .where(eq(offerTable.id, id))
      .limit(1);

    if (!offer) throw new Error("OFFER_NOT_FOUND");
    return offer;
  }

  public async getCurrentBannerOffer(): Promise<OfferResponse | null> {
    const now = new Date();
    const [offer] = await db
      .select()
      .from(offerTable)
      .where(
        and(
          eq(offerTable.showBanner, true),
          eq(offerTable.isActive, true),
          lte(offerTable.startDate, now),
          gte(offerTable.endDate, now),
        ),
      )
      .limit(1);

    return offer ?? null;
  }

  public async create(
    data: CreateOffer,
    userId: number,
  ): Promise<OfferResponse> {
    if (data.startDate >= data.endDate) {
      throw new Error("INVALID_OFFER_DATES");
    }

    const pct = Number(data.percentage);
    if (isNaN(pct) || pct <= 0 || pct > 100) {
      throw new Error("INVALID_OFFER_PERCENTAGE");
    }

    try {
      if (data.showBanner === true) {
        return await db.transaction(async (tx) => {
          await tx
            .update(offerTable)
            .set({ showBanner: false, updatedAt: new Date() })
            .where(eq(offerTable.showBanner, true));

          const [offer] = await tx
            .insert(offerTable)
            .values({
              ...data,
              createdBy: userId,
            })
            .returning();

          if (!offer) throw new Error("OFFER_CREATE_FAILED");
          return offer;
        });
      }

      const [offer] = await db
        .insert(offerTable)
        .values({
          ...data,
          createdBy: userId,
        })
        .returning();

      if (!offer) throw new Error("OFFER_CREATE_FAILED");
      return offer;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new Error("OFFER_BANNER_ALREADY_EXISTS");
      }
      throw error;
    }
  }

  public async update(id: number, data: UpdateOffer): Promise<OfferResponse> {
    const [existing] = await db
      .select()
      .from(offerTable)
      .where(eq(offerTable.id, id))
      .limit(1);

    if (!existing) throw new Error("OFFER_NOT_FOUND");

    const finalStartDate = data.startDate ?? existing.startDate;
    const finalEndDate = data.endDate ?? existing.endDate;

    if (finalStartDate >= finalEndDate) {
      throw new Error("INVALID_OFFER_DATES");
    }

    if (data.percentage !== undefined) {
      const pct = Number(data.percentage);
      if (isNaN(pct) || pct <= 0 || pct > 100) {
        throw new Error("INVALID_OFFER_PERCENTAGE");
      }
    }

    try {
      if (data.showBanner === true) {
        return await db.transaction(async (tx) => {
          await tx
            .update(offerTable)
            .set({ showBanner: false, updatedAt: new Date() })
            .where(and(eq(offerTable.showBanner, true), ne(offerTable.id, id)));

          const [updated] = await tx
            .update(offerTable)
            .set({
              ...data,
              updatedAt: new Date(),
            })
            .where(eq(offerTable.id, id))
            .returning();

          if (!updated) throw new Error("OFFER_NOT_FOUND");
          return updated;
        });
      }

      const [updated] = await db
        .update(offerTable)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(offerTable.id, id))
        .returning();

      if (!updated) throw new Error("OFFER_NOT_FOUND");
      return updated;
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new Error("OFFER_BANNER_ALREADY_EXISTS");
      }
      throw error;
    }
  }

  public async delete(id: number): Promise<void> {
    const [deleted] = await db
      .delete(offerTable)
      .where(eq(offerTable.id, id))
      .returning({ id: offerTable.id });

    if (!deleted) throw new Error("OFFER_NOT_FOUND");
  }

  public async updateStatus(
    id: number,
    value: boolean,
  ): Promise<OfferResponse> {
    const [updated] = await db
      .update(offerTable)
      .set({
        isActive: value,
        updatedAt: new Date(),
      })
      .where(eq(offerTable.id, id))
      .returning();

    if (!updated) throw new Error("OFFER_NOT_FOUND");
    return updated;
  }

  public async updateShowBanner(
    id: number,
    value: boolean,
  ): Promise<OfferResponse> {
    try {
      if (!value) {
        const [updated] = await db
          .update(offerTable)
          .set({
            showBanner: false,
            updatedAt: new Date(),
          })
          .where(eq(offerTable.id, id))
          .returning();

        if (!updated) throw new Error("OFFER_NOT_FOUND");
        return updated;
      }

      return await db.transaction(async (tx) => {
        const [existing] = await tx
          .select({ id: offerTable.id })
          .from(offerTable)
          .where(eq(offerTable.id, id))
          .limit(1);

        if (!existing) throw new Error("OFFER_NOT_FOUND");

        await tx
          .update(offerTable)
          .set({ showBanner: false, updatedAt: new Date() })
          .where(and(eq(offerTable.showBanner, true), ne(offerTable.id, id)));

        const [updated] = await tx
          .update(offerTable)
          .set({
            showBanner: true,
            updatedAt: new Date(),
          })
          .where(eq(offerTable.id, id))
          .returning();

        if (!updated) throw new Error("OFFER_NOT_FOUND");
        return updated;
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw new Error("OFFER_BANNER_ALREADY_EXISTS");
      }
      throw error;
    }
  }
}

export const offerService = new OfferService();
