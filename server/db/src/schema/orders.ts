import { pgTable, serial, text, integer, real, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { tablesTable } from "./tables";
import { customersTable } from "./customers";
import { usersTable } from "./users";
import { sessionsTable } from "./sessions";
import { paymentMethodsTable } from "./payment-methods";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  number: text("number").notNull(),
  tableId: integer("table_id").references(() => tablesTable.id),
  customerId: integer("customer_id").references(() => customersTable.id),
  employeeId: integer("employee_id").references(() => usersTable.id),
  sessionId: integer("session_id").references(() => sessionsTable.id),
  lines: jsonb("lines").notNull().default([]),
  subtotal: real("subtotal").notNull().default(0),
  tax: real("tax").notNull().default(0),
  discountTotal: real("discount_total").notNull().default(0),
  discountLabel: text("discount_label"),
  total: real("total").notNull().default(0),
  status: text("status").notNull().default("Draft"),
  paymentMethodId: integer("payment_method_id").references(() => paymentMethodsTable.id),
  paymentRef: text("payment_ref"),
  amountPaid: real("amount_paid"),
  sentToKitchen: boolean("sent_to_kitchen").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
