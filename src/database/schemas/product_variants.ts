import { boolean, index, integer, numeric, pgTable, text } from "drizzle-orm/pg-core";
import { productTable } from "./product";

export const productVariantTable = pgTable("product_variants", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  productId: integer("product_id").notNull().references(() => productTable.id, {onDelete: "cascade"}),
  size: text(),
  weight: numeric("weight", {precision: 10, scale: 2}),
  isAvailable: boolean("is_available").notNull().default(true),
},
(table) => [
    index("product_variants_product_id_idx").on(table.productId),
]);
