import { Router } from "express";
import { db, kdsTicketsTable, tablesTable, ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { ListKdsTicketsQueryParams } from "@workspace/api-zod";

const router = Router();

type KdsItem = { productId: number; productName: string | null; qty: number; done: boolean };

const STAGES = ["ToCook", "Preparing", "Completed"] as const;
type Stage = typeof STAGES[number];
const NEXT: Record<Stage, Stage | null> = { ToCook: "Preparing", Preparing: "Completed", Completed: null };

async function enrichTicket(t: typeof kdsTicketsTable.$inferSelect) {
  const [order] = await db.select({ tableId: ordersTable.tableId }).from(ordersTable).where(eq(ordersTable.id, t.orderId)).limit(1);
  const [table] = order?.tableId ? await db.select().from(tablesTable).where(eq(tablesTable.id, order.tableId)).limit(1) : [null];
  return {
    id: t.id,
    orderId: t.orderId,
    orderNumber: t.orderNumber,
    tableNumber: table?.number ?? null,
    items: t.items as KdsItem[],
    stage: t.stage,
    createdAt: t.createdAt.toISOString(),
  };
}

router.get("/kds", requireAuth, async (req, res) => {
  const query = ListKdsTicketsQueryParams.safeParse(req.query);
  let rows = await db.select().from(kdsTicketsTable).orderBy(kdsTicketsTable.createdAt);

  if (query.success) {
    if (query.data.stage) rows = rows.filter(r => r.stage === query.data.stage);
    if (query.data.search) {
      const s = query.data.search.toLowerCase();
      rows = rows.filter(r => r.orderNumber.toLowerCase().includes(s));
    }
  }

  const results = await Promise.all(rows.map(enrichTicket));
  res.json(results);
});

router.post("/kds/:id/advance", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const [ticket] = await db.select().from(kdsTicketsTable).where(eq(kdsTicketsTable.id, id)).limit(1);
  if (!ticket) { res.status(404).json({ error: "Not found" }); return; }

  const next = NEXT[ticket.stage as Stage];
  if (!next) {
    res.json(await enrichTicket(ticket));
    return;
  }

  const [updated] = await db.update(kdsTicketsTable).set({ stage: next }).where(eq(kdsTicketsTable.id, id)).returning();
  res.json(await enrichTicket(updated));
});

router.post("/kds/:id/items/:itemIndex/toggle", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const itemIndex = parseInt(req.params.itemIndex as string);

  const [ticket] = await db.select().from(kdsTicketsTable).where(eq(kdsTicketsTable.id, id)).limit(1);
  if (!ticket) { res.status(404).json({ error: "Not found" }); return; }

  const items = ticket.items as KdsItem[];
  if (itemIndex < 0 || itemIndex >= items.length) {
    res.status(400).json({ error: "Invalid item index" });
    return;
  }

  items[itemIndex] = { ...items[itemIndex], done: !items[itemIndex].done };
  const [updated] = await db.update(kdsTicketsTable).set({ items: items as any }).where(eq(kdsTicketsTable.id, id)).returning();
  res.json(await enrichTicket(updated));
});

export default router;
