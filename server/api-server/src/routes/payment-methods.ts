import { Router } from "express";
import { db, paymentMethodsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { CreatePaymentMethodBody, UpdatePaymentMethodParams, UpdatePaymentMethodBody, DeletePaymentMethodParams } from "@workspace/api-zod";

const router = Router();

const toRes = (m: typeof paymentMethodsTable.$inferSelect) => ({
  id: m.id, name: m.name, type: m.type, upiId: m.upiId, active: m.active,
});

router.get("/payment-methods", requireAuth, async (_req, res) => {
  const rows = await db.select().from(paymentMethodsTable).orderBy(paymentMethodsTable.createdAt);
  res.json(rows.map(toRes));
});

router.post("/payment-methods", requireAuth, async (req, res) => {
  const parsed = CreatePaymentMethodBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [m] = await db.insert(paymentMethodsTable).values({ ...parsed.data, active: parsed.data.active ?? true }).returning();
  res.status(201).json(toRes(m));
});

router.patch("/payment-methods/:id", requireAuth, async (req, res) => {
  const params = UpdatePaymentMethodParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdatePaymentMethodBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [m] = await db.update(paymentMethodsTable).set(parsed.data).where(eq(paymentMethodsTable.id, params.data.id)).returning();
  if (!m) { res.status(404).json({ error: "Not found" }); return; }
  res.json(toRes(m));
});

router.delete("/payment-methods/:id", requireAuth, async (req, res) => {
  const params = DeletePaymentMethodParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(paymentMethodsTable).where(eq(paymentMethodsTable.id, params.data.id));
  res.status(204).end();
});

export default router;
