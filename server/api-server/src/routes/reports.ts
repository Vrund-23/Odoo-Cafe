import { Router } from "express";
import { db, ordersTable, productsTable, categoriesTable } from "@workspace/db";
import { eq, gte, and, sum, count } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { GetReportSummaryQueryParams, GetSalesTrendQueryParams, GetTopProductsQueryParams, GetTopCategoriesQueryParams, GetTopOrdersQueryParams } from "@workspace/api-zod";

const router = Router();

function getPeriodStart(period?: string | null, from?: string | null): Date | null {
  if (from) return new Date(from);
  const now = new Date();
  if (period === "today") { const d = new Date(now); d.setHours(0, 0, 0, 0); return d; }
  if (period === "week") { const d = new Date(now); d.setDate(d.getDate() - 7); return d; }
  if (period === "month") { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d; }
  return null;
}

type CartLine = { productId: number; productName: string | null; qty: number; unitPrice: number; lineTotal: number };

router.get("/reports/summary", requireAuth, async (req, res) => {
  const query = GetReportSummaryQueryParams.safeParse(req.query);
  const from = getPeriodStart(query.data?.period, query.data?.from);

  let rows = await db.select().from(ordersTable).where(eq(ordersTable.status, "Paid"));
  if (from) rows = rows.filter(o => o.createdAt >= from);
  if (query.success) {
    if (query.data.employeeId) rows = rows.filter(o => o.employeeId === Number(query.data.employeeId));
    if (query.data.sessionId) rows = rows.filter(o => o.sessionId === Number(query.data.sessionId));
    if (query.data.productId) {
      const pid = Number(query.data.productId);
      rows = rows.filter(o => (o.lines as CartLine[]).some(l => l.productId === pid));
    }
  }

  const totalOrders = rows.length;
  const revenue = rows.reduce((s, o) => s + (o.total ?? 0), 0);
  res.json({ totalOrders, revenue, avgOrderValue: totalOrders ? revenue / totalOrders : 0 });
});

router.get("/reports/sales-trend", requireAuth, async (req, res) => {
  const query = GetSalesTrendQueryParams.safeParse(req.query);
  const from = getPeriodStart(query.data?.period, query.data?.from);

  let rows = await db.select().from(ordersTable).where(eq(ordersTable.status, "Paid"));
  if (from) rows = rows.filter(o => o.createdAt >= from);
  if (query.success && query.data.employeeId) rows = rows.filter(o => o.employeeId === Number(query.data.employeeId));
  if (query.success && query.data.sessionId) rows = rows.filter(o => o.sessionId === Number(query.data.sessionId));

  const map = new Map<string, { revenue: number; orders: number }>();
  for (const o of rows) {
    const d = o.createdAt;
    const label = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const existing = map.get(label) ?? { revenue: 0, orders: 0 };
    map.set(label, { revenue: existing.revenue + (o.total ?? 0), orders: existing.orders + 1 });
  }

  const trend = Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, v]) => ({ label, ...v }));

  res.json(trend);
});

router.get("/reports/top-products", requireAuth, async (req, res) => {
  const query = GetTopProductsQueryParams.safeParse(req.query);
  const from = getPeriodStart(query.data?.period);
  const limit = Number(query.data?.limit ?? 10);

  let rows = await db.select().from(ordersTable).where(eq(ordersTable.status, "Paid"));
  if (from) rows = rows.filter(o => o.createdAt >= from);

  const map = new Map<number, { productName: string; qty: number; revenue: number }>();
  for (const o of rows) {
    for (const l of (o.lines as CartLine[])) {
      const existing = map.get(l.productId) ?? { productName: l.productName ?? `Product ${l.productId}`, qty: 0, revenue: 0 };
      map.set(l.productId, {
        productName: existing.productName,
        qty: existing.qty + l.qty,
        revenue: existing.revenue + l.lineTotal,
      });
    }
  }

  const result = Array.from(map.entries())
    .map(([productId, v]) => ({ productId, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);

  res.json(result);
});

router.get("/reports/top-categories", requireAuth, async (req, res) => {
  const query = GetTopCategoriesQueryParams.safeParse(req.query);
  const from = getPeriodStart(query.data?.period);
  const limit = Number(query.data?.limit ?? 10);

  let orders = await db.select().from(ordersTable).where(eq(ordersTable.status, "Paid"));
  if (from) orders = orders.filter(o => o.createdAt >= from);

  const products = await db
    .select({ id: productsTable.id, categoryId: productsTable.categoryId })
    .from(productsTable);
  const categories = await db.select().from(categoriesTable);
  const catMap = new Map(categories.map(c => [c.id, { name: c.name, color: c.color }]));
  const productCatMap = new Map(products.map(p => [p.id, p.categoryId]));

  const map = new Map<number, { categoryName: string; categoryColor: string; revenue: number }>();
  for (const o of orders) {
    for (const l of (o.lines as CartLine[])) {
      const catId = productCatMap.get(l.productId);
      if (!catId) continue;
      const cat = catMap.get(catId);
      if (!cat) continue;
      const existing = map.get(catId) ?? { categoryName: cat.name, categoryColor: cat.color, revenue: 0 };
      map.set(catId, { ...existing, revenue: existing.revenue + l.lineTotal });
    }
  }

  const result = Array.from(map.entries())
    .map(([categoryId, v]) => ({ categoryId, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);

  res.json(result);
});

router.get("/reports/top-orders", requireAuth, async (req, res) => {
  const query = GetTopOrdersQueryParams.safeParse(req.query);
  const from = getPeriodStart(query.data?.period);
  const limit = Number(query.data?.limit ?? 10);

  let rows = await db.select().from(ordersTable).where(eq(ordersTable.status, "Paid"));
  if (from) rows = rows.filter(o => o.createdAt >= from);

  rows = rows.sort((a, b) => (b.total ?? 0) - (a.total ?? 0)).slice(0, limit);

  res.json(rows.map(o => ({
    id: o.id,
    number: o.number,
    tableId: o.tableId,
    tableNumber: null,
    customerId: o.customerId,
    customerName: null,
    customerEmail: null,
    lines: o.lines,
    subtotal: o.subtotal,
    tax: o.tax,
    discountTotal: o.discountTotal,
    discountLabel: o.discountLabel,
    total: o.total,
    status: o.status,
    paymentMethodId: o.paymentMethodId,
    paymentRef: o.paymentRef,
    amountPaid: o.amountPaid,
    sentToKitchen: o.sentToKitchen,
    employeeId: o.employeeId,
    sessionId: o.sessionId,
    createdAt: o.createdAt.toISOString(),
  })));
});

export default router;
