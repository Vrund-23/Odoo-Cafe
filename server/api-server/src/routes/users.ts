import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { CreateUserBody, UpdateUserBody, UpdateUserParams, DeleteUserParams, ArchiveUserParams, ChangePasswordParams, ChangePasswordBody } from "@workspace/api-zod";

const router = Router();

const toPublic = (u: typeof usersTable.$inferSelect) => ({
  id: u.id, name: u.name, email: u.email, role: u.role, active: u.active,
});

router.get("/users", requireAuth, async (_req, res) => {
  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  res.json(users.map(toPublic));
});

router.post("/users", requireAuth, async (req, res) => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }
  const { name, email, password, role } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db.insert(usersTable).values({ name, email, passwordHash, role }).returning();
  res.status(201).json(toPublic(user));
});

router.patch("/users/:id", requireAuth, async (req, res) => {
  const params = UpdateUserParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [user] = await db.update(usersTable).set(parsed.data).where(eq(usersTable.id, params.data.id)).returning();
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json(toPublic(user));
});

router.delete("/users/:id", requireAuth, async (req, res) => {
  const params = DeleteUserParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(usersTable).where(eq(usersTable.id, params.data.id));
  res.status(204).end();
});

router.post("/users/:id/archive", requireAuth, async (req, res) => {
  const params = ArchiveUserParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [user] = await db.update(usersTable).set({ active: false }).where(eq(usersTable.id, params.data.id)).returning();
  if (!user) { res.status(404).json({ error: "Not found" }); return; }
  res.json(toPublic(user));
});

router.post("/users/:id/change-password", requireAuth, async (req, res) => {
  const params = ChangePasswordParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = ChangePasswordBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, params.data.id));
  res.json({ ok: true });
});

export default router;
