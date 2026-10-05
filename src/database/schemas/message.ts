import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const messageTable = pgTable(
  "messages",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    subject: text("subject").notNull(),
    message: text("message").notNull(),
    isViewed: boolean("is_viewed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("messages_email_viewed_idx").on(table.email, table.isViewed),
    index("messages_phone_viewed_idx").on(table.phone, table.isViewed),
    index("messages_viewed_created_idx").on(table.isViewed, table.createdAt),
  ],
);
