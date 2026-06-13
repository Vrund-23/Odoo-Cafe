import { pgTable, serial, text, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const couponsTable = pgTable("coupons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("Coupon"),
  code: text("code"),
  discountKind: text("discount_kind").notNull().default("percent"),
  discountValue: real("discount_value").notNull().default(10),
  active: boolean("active").notNull().default(true),
  apply: text("apply"),
  productId: integer("product_id"),
  minQty: integer("min_qty"),
  minOrderAmount: real("min_order_amount"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCouponSchema = createInsertSchema(couponsTable).omit({ id: true, createdAt: true });
export type InsertCoupon = z.infer<typeof insertCouponSchema>;
export type Coupon = typeof couponsTable.$inferSelect;
