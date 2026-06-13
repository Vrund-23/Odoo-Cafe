import { Router } from "express";
import { db, sessionsTable, ordersTable, usersTable } from "@workspace/db";
import { eq, isNull, count, sum, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";

const router = Router();

const toRes = async (s: typeof sessionsTable.$inferSelect) => {
  const [emp] = await db.select().from(usersTable).where(eq(usersTable.id, s.employeeId)).limit(1);
  const [stats] = await db
    .select({ total: count(), revenue: sum(ordersTable.total) })
    .from(ordersTable)
    .where(and(eq(ordersTable.sessionId, s.id), eq(ordersTable.status, "Paid")));

  return {
    id: s.id,
    openedAt: s.openedAt.toISOString(),
    closedAt: s.closedAt?.toISOString() ?? null,
    openingAmount: s.openingAmount,
    closingAmount: s.closingAmount,
    employeeId: s.employeeId,
    employeeName: emp?.name ?? null,
    totalOrders: Number(stats?.total ?? 0),
    totalRevenue: Number(stats?.revenue ?? 0),
  };
};

router.get("/sessions/current", requireAuth, async (req: AuthRequest, res) => {
  const [session] = await db.select().from(sessionsTable)
    .where(isNull(sessionsTable.closedAt))
    .orderBy(sessionsTable.openedAt)
    .limit(1);
  if (!session) {
    res.status(404).json({ error: "No open session" });
    return;
  }
  res.json(await toRes(session));
});

router.post("/sessions/open", requireAuth, async (req: AuthRequest, res) => {
  const existing = await db.select().from(sessionsTable).where(isNull(sessionsTable.closedAt)).limit(1);
  if (existing.length > 0) {
    res.json(await toRes(existing[0]));
    return;
  }
  const [session] = await db.insert(sessionsTable).values({
    employeeId: req.userId!,
    openingAmount: 0,
  }).returning();
  res.status(201).json(await toRes(session));
});

router.post("/sessions/close", requireAuth, async (_req, res) => {
  const [session] = await db.select().from(sessionsTable).where(isNull(sessionsTable.closedAt)).limit(1);
  if (!session) {
    res.status(404).json({ error: "No open session" });
    return;
  }

  const [revenueRow] = await db
    .select({ revenue: sum(ordersTable.total) })
    .from(ordersTable)
    .where(and(eq(ordersTable.sessionId, session.id), eq(ordersTable.status, "Paid")));

  const closingAmount = Number(revenueRow?.revenue ?? 0);
  const [closed] = await db.update(sessionsTable)
    .set({ closedAt: new Date(), closingAmount })
    .where(eq(sessionsTable.id, session.id))
    .returning();

  res.json(await toRes(closed));
});

router.get("/sessions", requireAuth, async (_req, res) => {
  const sessions = await db.select().from(sessionsTable).orderBy(sessionsTable.openedAt);
  const results = await Promise.all(sessions.map(toRes));
  res.json(results);
});

export default router;
