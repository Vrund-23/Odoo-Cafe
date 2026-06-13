import { Router } from "express";
import { db, floorsTable, tablesTable, ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { CreateFloorBody, UpdateFloorParams, UpdateFloorBody, DeleteFloorParams } from "@workspace/api-zod";

const router = Router();

router.get("/floors", requireAuth, async (_req, res) => {
  const floors = await db.select().from(floorsTable).orderBy(floorsTable.createdAt);
  const tables = await db.select().from(tablesTable).orderBy(tablesTable.number);
  const activeOrders = await db.select({ tableId: ordersTable.tableId }).from(ordersTable).where(eq(ordersTable.status, "Draft"));
  const occupiedTableIds = new Set(activeOrders.map(o => o.tableId).filter(Boolean));

  const floorsWithTables = floors.map(f => ({
    id: f.id,
    name: f.name,
    tables: tables
      .filter(t => t.floorId === f.id)
      .map(t => ({
        id: t.id,
        floorId: t.floorId,
        floorName: f.name,
        number: t.number,
        seats: t.seats,
        active: t.active,
        hasActiveOrder: occupiedTableIds.has(t.id),
      })),
  }));

  res.json(floorsWithTables);
});

router.post("/floors", requireAuth, async (req, res) => {
  const parsed = CreateFloorBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [floor] = await db.insert(floorsTable).values(parsed.data).returning();
  res.status(201).json({ id: floor.id, name: floor.name });
});

router.patch("/floors/:id", requireAuth, async (req, res) => {
  const params = UpdateFloorParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateFloorBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [floor] = await db.update(floorsTable).set(parsed.data).where(eq(floorsTable.id, params.data.id)).returning();
  if (!floor) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ id: floor.id, name: floor.name });
});

router.delete("/floors/:id", requireAuth, async (req, res) => {
  const params = DeleteFloorParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(floorsTable).where(eq(floorsTable.id, params.data.id));
  res.status(204).end();
});

export default router;
