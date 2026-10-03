import { and, arrayContains, asc, count, desc, eq, ilike, or } from "drizzle-orm";
import { productTable, productTranslationTable } from "../../database/schemas";
import type {
  GetProductsOptions,
  IProductService,
  Locale,
  ProductResponse,
} from "./product.types";
import { db } from "../../database";

class ProductService implements IProductService {
  public async getAll(options: GetProductsOptions, locale: Locale): Promise<{data: ProductResponse[]; total: number}> {
    const { page, limit, collectionId, offerId, status, bestSeller, search, tag, sort = "createdAt", order = "desc" } = options;
    const offset = (page - 1) * limit;
    const conditions = [];
    if (collectionId !== undefined) {conditions.push(eq(productTable.collectionId, collectionId))}
    if (offerId !== undefined) {conditions.push(eq(productTable.offerId, offerId))}
    if (status !== undefined) {conditions.push(eq(productTable.status, status))}
    if (bestSeller !== undefined) {conditions.push(eq(productTable.isBestSeller, bestSeller))}
    if (tag) {conditions.push(arrayContains(productTranslationTable.tags, [tag]))}
    if (search) { conditions.push(or(ilike(productTranslationTable.name, `%${search}%`), ilike(productTranslationTable.description, `%${search}%`)))}
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const sortColumn = { createdAt: productTable.createdAt, name: productTranslationTable.name}[sort];
    const orderBy = order === "asc" ? asc(sortColumn) : desc(sortColumn);

    const [products, countResult] = await Promise.all([
      db
        .select({product: productTable, translation: productTranslationTable})
        .from(productTable)
        .leftJoin(productTranslationTable, and(eq(productTranslationTable.productId, productTable.id), eq(productTranslationTable.locale, locale)))
        .where(where)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset),

      db
        .select({count: count()})
        .from(productTable)
        .leftJoin(productTranslationTable, and(eq(productTranslationTable.productId, productTable.id), eq(productTranslationTable.locale, locale)))
        .where(where),
    ]);

    const data: ProductResponse[] = products.map(
      ({ product, translation }) => ({
        id: product.id,
        slug: product.slug,
        status: product.status,
        isBestSeller: product.isBestSeller,
        isCustomizable: product.isCustomizable,
        warranty: product.warranty,
        weight: product.weight,
        translation,
        images: [],
        variants: [],
      }),
    );

    return {
      data,
      total: countResult[0]?.count ?? 0,
    };
  }
}

// export const product = new ProductService();
