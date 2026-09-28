import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
export const waitlistTable = pgTable("waitlist", {
  email: text("email").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
