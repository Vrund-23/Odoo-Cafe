import { Router } from "express";
import { db, couponsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { CreateCouponBody, UpdateCouponParams, UpdateCouponBody, DeleteCouponParams, ValidateCouponBody } from "@workspace/api-zod";

const router = Router();

const toRes = (c: typeof couponsTable.$inferSelect) => ({
  id: c.id,
  name: c.name,
  type: c.type,
  code: c.code,
  discountKind: c.discountKind,
  discountValue: c.discountValue,
  active: c.active,
  apply: c.apply,
  productId: c.productId,
  minQty: c.minQty,
  minOrderAmount: c.minOrderAmount,
  description: c.description,
});

router.get("/coupons", requireAuth, async (_req, res) => {
  const rows = await db.select().from(couponsTable).orderBy(couponsTable.createdAt);
  res.json(rows.map(toRes));
});

router.post("/coupons/validate", requireAuth, async (req, res) => {
  const parsed = ValidateCouponBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [coupon] = await db.select().from(couponsTable)
    .where(and(eq(couponsTable.code, parsed.data.code), eq(couponsTable.active, true), eq(couponsTable.type, "Coupon")))
    .limit(1);
  if (!coupon) { res.status(404).json({ error: "Invalid coupon" }); return; }
  res.json(toRes(coupon));
});

router.post("/coupons", requireAuth, async (req, res) => {
  const parsed = CreateCouponBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [c] = await db.insert(couponsTable).values({ ...parsed.data, active: parsed.data.active ?? true }).returning();
  res.status(201).json(toRes(c));
});

router.patch("/coupons/:id", requireAuth, async (req, res) => {
  const params = UpdateCouponParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateCouponBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [c] = await db.update(couponsTable).set(parsed.data).where(eq(couponsTable.id, params.data.id)).returning();
  if (!c) { res.status(404).json({ error: "Not found" }); return; }
  res.json(toRes(c));
});

router.delete("/coupons/:id", requireAuth, async (req, res) => {
  const params = DeleteCouponParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(couponsTable).where(eq(couponsTable.id, params.data.id));
  res.status(204).end();
});

export default router;
