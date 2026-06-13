import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { ordersTable } from "./orders";

export const kdsTicketsTable = pgTable("kds_tickets", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id),
  orderNumber: text("order_number").notNull(),
  items: jsonb("items").notNull().default([]),
  stage: text("stage").notNull().default("ToCook"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertKdsTicketSchema = createInsertSchema(kdsTicketsTable).omit({ id: true, createdAt: true });
export type InsertKdsTicket = z.infer<typeof insertKdsTicketSchema>;
export type KdsTicket = typeof kdsTicketsTable.$inferSelect;
