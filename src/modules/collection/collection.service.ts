import { and, eq } from "drizzle-orm";
import { db } from "../../database";
import { collectionTable } from "../../database/schemas";
import type { CreateCollectionInput, UpdateCollectionInput } from "./collection.schemas";

interface ICollectionService {
  get(): Promise<Omit<typeof collectionTable.$inferSelect, "userId">[]>;
  create(input: CreateCollectionInput, userId: number) : Promise<typeof collectionTable.$inferSelect>;
  update(input: UpdateCollectionInput, collectionId: number, userId: number): Promise<typeof collectionTable.$inferSelect>;
  delete(collectionId: number, userId: number): Promise<void>;
}

class CollectionService implements ICollectionService {
  public async get() {
    return db.select({
      id: collectionTable.id,
      arName: collectionTable.arName,
      enName: collectionTable.enName,
      icon: collectionTable.icon,
      createdAt: collectionTable.createdAt,
      updatedAt: collectionTable.updatedAt,
    }).from(collectionTable);
  }
  public async create(input: CreateCollectionInput, userId: number) {
    const [collection] = await db
      .insert(collectionTable)
      .values({...input, userId})
      .returning();

    if (!collection) throw new Error("COLLECTION_CREATE_FAILED");
    return collection;
  }
   public async update(input: UpdateCollectionInput, collectionId: number, userId: number) {
    const [collection] = await db
      .update(collectionTable)
      .set({...input, updatedAt: new Date()})
      .where(and(eq(collectionTable.id, collectionId), eq(collectionTable.userId, userId)))
      .returning();

    if (!collection) throw new Error("COLLECTION_NOT_FOUND");
    return collection;
  }
   public async delete(collectionId: number, userId: number) {
    const [collection] = await db
      .delete(collectionTable)
      .where(and(eq(collectionTable.id, collectionId), eq(collectionTable.userId, userId)))
      .returning({id: collectionTable.id});

    if (!collection) throw new Error("COLLECTION_NOT_FOUND");
   }
}

export const collection = new CollectionService();
