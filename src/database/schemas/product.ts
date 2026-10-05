import {boolean, index, integer, numeric, pgTable, text, timestamp, uniqueIndex} from "drizzle-orm/pg-core";
import { collectionTable } from "./collection";
import { userTable } from "./users";
import { offerTable } from "./offer";

export const productTable = pgTable(
  "products",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    collectionId: integer("collection_id").notNull().references(() => collectionTable.id),
    userId: integer("user_id").notNull().references(() => userTable.id),
    offerId: integer("offer_id").references(() => offerTable.id),
    slug: text().notNull(),
    status: text().$type<"active" | "inactive">().notNull().default("active"),
    isBestSeller: boolean("is_best_seller").notNull().default(false),
    isCustomizable: boolean("is_customizable").notNull().default(false),
    warranty: integer().notNull().default(0),
    weight: numeric("weight", {precision: 10, scale: 2}),
    createdAt: timestamp("created_at", {withTimezone: true}) .defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {withTimezone: true}).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("products_slug_unique").on(table.slug),
    index("products_collection_id_idx").on(table.collectionId),
    index("products_user_id_idx").on(table.userId),
    index("products_offer_id_idx").on(table.offerId),
    index("products_status_idx").on(table.status),
    index("products_best_seller_idx").on(table.status, table.isBestSeller),
    index("products_created_at_idx").on(table.createdAt),
  ],
);
