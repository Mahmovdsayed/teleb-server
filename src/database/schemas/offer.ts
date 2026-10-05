import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { userTable } from "./users";

export const offerTable = pgTable(
  "offers",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    arName: text("ar_name").notNull(),
    arDescription: text("ar_description").notNull().default(""),
    arBannerText: text("ar_banner_text").notNull().default(""),
    enName: text("en_name").notNull(),
    enDescription: text("en_description").notNull().default(""),
    enBannerText: text("en_banner_text").notNull().default(""),
    percentage: numeric("percentage", { precision: 5, scale: 2 }).notNull(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),
    isActive: boolean("is_active").notNull().default(true),
    showBanner: boolean("show_banner").notNull().default(false),
    bannerBackgroundColor: text("banner_background_color").notNull().default("#dc2626"),
    bannerTextColor: text("banner_text_color").notNull().default("#ffffff"),
    createdBy: integer("created_by").notNull().references(() => userTable.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("offers_one_banner_idx")
      .on(table.showBanner)
      .where(sql`${table.showBanner} = true`),
    index("offers_active_dates_idx").on(table.isActive, table.startDate, table.endDate),
    index("offers_created_at_idx").on(table.createdAt),
  ],
);
