import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { userTable } from "./users";

export const collectionTable = pgTable(
  "collections",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),

    arName: text("ar_name").notNull(),
    enName: text("en_name").notNull(),

    icon: text("icon").notNull(),
    userId: integer("user_id").notNull().references(() => userTable.id),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("collections_user_id_idx").on(table.userId)],
);
