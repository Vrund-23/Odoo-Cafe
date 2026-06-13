import { pgTable, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { floorsTable } from "./floors";

export const tablesTable = pgTable("tables", {
  id: serial("id").primaryKey(),
  floorId: integer("floor_id").notNull().references(() => floorsTable.id),
  number: integer("number").notNull(),
  seats: integer("seats").notNull().default(4),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTableSchema = createInsertSchema(tablesTable).omit({ id: true, createdAt: true });
export type InsertTable = z.infer<typeof insertTableSchema>;
export type Table = typeof tablesTable.$inferSelect;
