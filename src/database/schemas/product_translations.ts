import { integer, index, jsonb, pgTable, text, uniqueIndex, numeric } from "drizzle-orm/pg-core";
import { productTable } from "./product";

export const productTranslationTable = pgTable(
  "product_translations",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    productId: integer("product_id").notNull().references(() => productTable.id, {onDelete: "cascade"}),
    locale: text().$type<"ar" | "en">().notNull(),
    name: text().notNull(),
    description: text(),
    smallDescription: text("small_description"),
    materials: jsonb().$type<{ name: string }[]>().default([]),
    features: jsonb().$type<{ name: string }[]>().default([]),
    height: numeric("height", {precision: 10,scale: 2}),
    width: numeric("width", {precision: 10, scale: 2}),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    metaKeywords: text("meta_keywords").array().default([]),
    tags: text("tags").array().notNull().default([]),
  },
  (table) => [
    uniqueIndex("product_translation_product_locale_unique").on(table.productId, table.locale),
    index("product_translation_locale_idx").on(table.locale),
    index("product_translation_name_idx").on(table.name),
    index("product_translation_tags_idx").using("gin", table.tags),
  ],
);