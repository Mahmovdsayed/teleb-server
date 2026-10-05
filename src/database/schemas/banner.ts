import { index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { userTable } from "./users";

export interface BannerImage {
  url: string;
  publicId: string;
  order: number;
}

export const bannerTable = pgTable(
  "banners",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    images: jsonb("images").$type<BannerImage[]>().notNull().default([]),
    title: text().notNull(),
    userId: integer("user_id").notNull().references(() => userTable.id),
    createdAt: timestamp("created_at", {withTimezone: true}).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", {withTimezone: true}).defaultNow().notNull(),
  },
  (table) => [index("banners_user_id_idx").on(table.userId)],
);
