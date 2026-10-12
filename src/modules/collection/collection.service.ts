import { and, count, eq } from "drizzle-orm";
import { db } from "../../database";
import { collectionTable, productTable } from "../../database/schemas";
import type {
  CreateCollectionInput,
  UpdateCollectionInput,
} from "./collection.schemas";

interface ICollectionService {
  get(): Promise<Omit<typeof collectionTable.$inferSelect, "userId">[]>;
  getById(
    id: number,
  ): Promise<Omit<typeof collectionTable.$inferSelect, "userId">[]>;
  create(
    input: CreateCollectionInput,
    userId: number,
  ): Promise<typeof collectionTable.$inferSelect>;
  update(
    input: UpdateCollectionInput,
    collectionId: number,
    userId: number,
  ): Promise<typeof collectionTable.$inferSelect>;
  delete(collectionId: number, userId: number): Promise<void>;
}

class CollectionService implements ICollectionService {
  public async get() {
    return db
      .select({
        id: collectionTable.id,
        arName: collectionTable.arName,
        enName: collectionTable.enName,
        icon: collectionTable.icon,
        createdAt: collectionTable.createdAt,
        updatedAt: collectionTable.updatedAt,
      })
      .from(collectionTable);
  }
  public async getById(id: number) {
    const results = await db
      .select({
        id: collectionTable.id,
        arName: collectionTable.arName,
        enName: collectionTable.enName,
        icon: collectionTable.icon,
        createdAt: collectionTable.createdAt,
        updatedAt: collectionTable.updatedAt,
      })
      .from(collectionTable)
      .where(eq(collectionTable.id, id))
      .limit(1);

      if(!results[0]) throw new Error("COLLECTION_NOT_FOUND");

    return results;
  }
  public async create(input: CreateCollectionInput, userId: number) {
    const [collection] = await db
      .insert(collectionTable)
      .values({ ...input, userId })
      .returning();

    if (!collection) throw new Error("COLLECTION_CREATE_FAILED");
    return collection;
  }
  public async update(
    input: UpdateCollectionInput,
    collectionId: number,
    userId: number,
  ) {
    const [collection] = await db
      .update(collectionTable)
      .set({ ...input, updatedAt: new Date() })
      .where(
        and(
          eq(collectionTable.id, collectionId),
          eq(collectionTable.userId, userId),
        ),
      )
      .returning();

    if (!collection) throw new Error("COLLECTION_NOT_FOUND");
    return collection;
  }
  public async delete(collectionId: number, userId: number) {
    const [collection] = await db
      .select({ id: collectionTable.id })
      .from(collectionTable)
      .where(
        and(
          eq(collectionTable.id, collectionId),
          eq(collectionTable.userId, userId),
        ),
      )
      .limit(1);

    if (!collection) {
      throw new Error("COLLECTION_NOT_FOUND");
    }

    const [result] = await db
      .select({ total: count() })
      .from(productTable)
      .where(eq(productTable.collectionId, collectionId));

    if (Number(result?.total ?? 0) > 0)
      throw new Error("COLLECTION_HAS_PRODUCTS");

    await db
      .delete(collectionTable)
      .where(
        and(
          eq(collectionTable.id, collectionId),
          eq(collectionTable.userId, userId),
        ),
      );
  }
}

export const collection = new CollectionService();
