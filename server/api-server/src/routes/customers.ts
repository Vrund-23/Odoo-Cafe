import { Router } from "express";
import { db, customersTable } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { ListCustomersQueryParams, CreateCustomerBody, UpdateCustomerParams, UpdateCustomerBody, DeleteCustomerParams } from "@workspace/api-zod";

const router = Router();

const toRes = (c: typeof customersTable.$inferSelect) => ({
  id: c.id, name: c.name, email: c.email, phone: c.phone,
});

router.get("/customers", requireAuth, async (req, res) => {
  const query = ListCustomersQueryParams.safeParse(req.query);
  let rows = await db.select().from(customersTable).orderBy(customersTable.name);
  if (query.success && query.data.search) {
    const s = query.data.search.toLowerCase();
    rows = rows.filter(r => r.name.toLowerCase().includes(s) || r.email.toLowerCase().includes(s) || r.phone.includes(s));
  }
  res.json(rows.map(toRes));
});

router.post("/customers", requireAuth, async (req, res) => {
  const parsed = CreateCustomerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [c] = await db.insert(customersTable).values({
    name: parsed.data.name,
    email: parsed.data.email ?? "",
    phone: parsed.data.phone ?? "",
  }).returning();
  res.status(201).json(toRes(c));
});

router.patch("/customers/:id", requireAuth, async (req, res) => {
  const params = UpdateCustomerParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateCustomerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [c] = await db.update(customersTable).set(parsed.data).where(eq(customersTable.id, params.data.id)).returning();
  if (!c) { res.status(404).json({ error: "Not found" }); return; }
  res.json(toRes(c));
});

router.delete("/customers/:id", requireAuth, async (req, res) => {
  const params = DeleteCustomerParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(customersTable).where(eq(customersTable.id, params.data.id));
  res.status(204).end();
});

export default router;
