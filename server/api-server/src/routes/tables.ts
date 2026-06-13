import { Router } from "express";
import { db, tablesTable, floorsTable, ordersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { CreateTableBody, UpdateTableParams, UpdateTableBody, DeleteTableParams } from "@workspace/api-zod";

const router = Router();

const toRes = async (t: typeof tablesTable.$inferSelect) => {
  const [floor] = await db.select().from(floorsTable).where(eq(floorsTable.id, t.floorId)).limit(1);
  const activeOrders = await db.select().from(ordersTable)
    .where(and(eq(ordersTable.tableId, t.id), eq(ordersTable.status, "Draft")));
  return {
    id: t.id,
    floorId: t.floorId,
    floorName: floor?.name ?? null,
    number: t.number,
    seats: t.seats,
    active: t.active,
    hasActiveOrder: activeOrders.length > 0,
  };
};

router.get("/tables", requireAuth, async (_req, res) => {
  const tables = await db.select().from(tablesTable).orderBy(tablesTable.number);
  const floors = await db.select().from(floorsTable);
  const activeOrders = await db.select({ tableId: ordersTable.tableId }).from(ordersTable).where(eq(ordersTable.status, "Draft"));
  const occupiedTableIds = new Set(activeOrders.map(o => o.tableId).filter(Boolean));
  const floorMap = new Map(floors.map(f => [f.id, f.name]));

  res.json(tables.map(t => ({
    id: t.id,
    floorId: t.floorId,
    floorName: floorMap.get(t.floorId) ?? null,
    number: t.number,
    seats: t.seats,
    active: t.active,
    hasActiveOrder: occupiedTableIds.has(t.id),
  })));
});

router.post("/tables", requireAuth, async (req, res) => {
  const parsed = CreateTableBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [t] = await db.insert(tablesTable).values({ ...parsed.data, active: parsed.data.active ?? true }).returning();
  res.status(201).json(await toRes(t));
});

router.patch("/tables/:id", requireAuth, async (req, res) => {
  const params = UpdateTableParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateTableBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [t] = await db.update(tablesTable).set(parsed.data).where(eq(tablesTable.id, params.data.id)).returning();
  if (!t) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await toRes(t));
});

router.delete("/tables/:id", requireAuth, async (req, res) => {
  const params = DeleteTableParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(tablesTable).where(eq(tablesTable.id, params.data.id));
  res.status(204).end();
});

export default router;
