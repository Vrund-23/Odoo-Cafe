import { Router } from "express";
import { db, productsTable, categoriesTable } from "@workspace/db";
import { eq, ilike, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { ListProductsQueryParams, CreateProductBody, UpdateProductParams, UpdateProductBody, DeleteProductParams } from "@workspace/api-zod";

const router = Router();

router.get("/products", requireAuth, async (req, res) => {
  const query = ListProductsQueryParams.safeParse(req.query);
  let rows = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      categoryId: productsTable.categoryId,
      categoryName: categoriesTable.name,
      categoryColor: categoriesTable.color,
      price: productsTable.price,
      unit: productsTable.unit,
      tax: productsTable.tax,
      description: productsTable.description,
      sendToKitchen: productsTable.sendToKitchen,
    })
    .from(productsTable)
    .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
    .orderBy(productsTable.createdAt);

  if (query.success) {
    if (query.data.categoryId) {
      rows = rows.filter(r => r.categoryId === Number(query.data.categoryId));
    }
    if (query.data.search) {
      const s = query.data.search.toLowerCase();
      rows = rows.filter(r => r.name.toLowerCase().includes(s));
    }
  }

  res.json(rows);
});

router.post("/products", requireAuth, async (req, res) => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [product] = await db.insert(productsTable).values(parsed.data).returning();
  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, product.categoryId)).limit(1);
  res.status(201).json({ ...product, categoryName: cat?.name ?? null, categoryColor: cat?.color ?? null });
});

router.patch("/products/:id", requireAuth, async (req, res) => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const [product] = await db.update(productsTable).set(parsed.data).where(eq(productsTable.id, params.data.id)).returning();
  if (!product) { res.status(404).json({ error: "Not found" }); return; }
  const [cat] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, product.categoryId)).limit(1);
  res.json({ ...product, categoryName: cat?.name ?? null, categoryColor: cat?.color ?? null });
});

router.delete("/products/:id", requireAuth, async (req, res) => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(productsTable).where(eq(productsTable.id, params.data.id));
  res.status(204).end();
});

export default router;
