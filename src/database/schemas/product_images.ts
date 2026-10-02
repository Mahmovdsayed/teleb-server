import { boolean, integer, index, pgTable, text, uniqueIndex } from "drizzle-orm/pg-core";
import { productTable } from "./product";
import { sql } from "drizzle-orm";

export const productImageTable = pgTable(
  "product_images",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    productId: integer("product_id").notNull().references(() => productTable.id, {onDelete: "cascade"}),
    url: text().notNull(),
    publicId: text("public_id").notNull(),
    order: integer().notNull().default(0),
    isMain: boolean("is_main").notNull().default(false),
  },
  (table) => [
    index("product_images_product_id_idx").on(table.productId, table.order),
    uniqueIndex("product_images_one_main_idx").on(table.productId).where(sql`${table.isMain} = true`)
  ],
);
