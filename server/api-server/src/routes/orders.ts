import { Router } from "express";
import { db, ordersTable, tablesTable, customersTable, paymentMethodsTable, productsTable, couponsTable, sessionsTable, kdsTicketsTable } from "@workspace/db";
import { eq, and, isNull, desc, like } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import {
  ListOrdersQueryParams,
  CreateOrderBody,
  GetOrderParams,
  UpdateOrderParams,
  UpdateOrderBody,
  DeleteOrderParams,
  PayOrderBody,
} from "@workspace/api-zod";

const router = Router();

type CartLine = {
  productId: number;
  productName: string | null;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  productDiscount: number | null;
  productDiscountLabel: string | null;
};

function calcOrder(lines: CartLine[], discountKind?: string | null, discountValue?: number | null) {
  const subtotal = lines.reduce((s, l) => s + l.lineTotal - (l.productDiscount ?? 0), 0);
  const taxRate = 0.05; // Simplified tax — per product ideally but simplified
  let discountTotal = 0;
  let discountLabel: string | null = null;

  if (discountKind && discountValue) {
    if (discountKind === "percent") {
      discountTotal = subtotal * (discountValue / 100);
      discountLabel = `${discountValue}% off`;
    } else {
      discountTotal = discountValue;
      discountLabel = `₹${discountValue} off`;
    }
  }

  const taxable = subtotal - discountTotal;
  const tax = taxable * taxRate;
  const total = taxable + tax;
  return { subtotal, tax, discountTotal, discountLabel, total };
}

async function enrichOrder(o: typeof ordersTable.$inferSelect) {
  const [table] = o.tableId ? await db.select().from(tablesTable).where(eq(tablesTable.id, o.tableId)).limit(1) : [null];
  const [customer] = o.customerId ? await db.select().from(customersTable).where(eq(customersTable.id, o.customerId)).limit(1) : [null];
  const lines = (o.lines as CartLine[]) ?? [];

  return {
    id: o.id,
    number: o.number,
    tableId: o.tableId,
    tableNumber: table?.number ?? null,
    customerId: o.customerId,
    customerName: customer?.name ?? null,
    customerEmail: customer?.email ?? null,
    lines,
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
  };
}

function genOrderNumber() {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `ORD-${n}`;
}

router.get("/orders", requireAuth, async (req, res) => {
  const query = ListOrdersQueryParams.safeParse(req.query);
  let dbQuery = db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  const rows = await dbQuery;

  let filtered = rows;
  if (query.success) {
    if (query.data.sessionId) filtered = filtered.filter(o => o.sessionId === Number(query.data.sessionId));
    if (query.data.status) filtered = filtered.filter(o => o.status === query.data.status);
    if (query.data.search) {
      const s = query.data.search.toLowerCase();
      filtered = filtered.filter(o => o.number.toLowerCase().includes(s));
    }
  }

  const results = await Promise.all(filtered.map(enrichOrder));
  res.json(results);
});

router.post("/orders", requireAuth, async (req: AuthRequest, res) => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const [order] = await db.insert(ordersTable).values({
    number: genOrderNumber(),
    tableId: parsed.data.tableId ?? null,
    sessionId: parsed.data.sessionId ?? null,
    employeeId: req.userId!,
    lines: [],
    status: "Draft",
  }).returning();

  res.status(201).json(await enrichOrder(order));
});

router.get("/orders/:id", requireAuth, async (req, res) => {
  const params = GetOrderParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id)).limit(1);
  if (!order) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await enrichOrder(order));
});

router.patch("/orders/:id", requireAuth, async (req, res) => {
  const params = UpdateOrderParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const [existing] = await db.select().from(ordersTable).where(eq(ordersTable.id, params.data.id)).limit(1);
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }

  let lines: CartLine[] = (existing.lines as CartLine[]) ?? [];

  if (parsed.data.lines) {
    const products = await db.select().from(productsTable);
    const productMap = new Map(products.map(p => [p.id, p]));

    lines = parsed.data.lines.map(l => {
      const p = productMap.get(l.productId);
      return {
        productId: l.productId,
        productName: p?.name ?? null,
        qty: l.qty,
        unitPrice: l.unitPrice,
        lineTotal: l.qty * l.unitPrice,
        productDiscount: null,
        productDiscountLabel: null,
      };
    });

    // Check automated promotions
    const promotions = await db.select().from(couponsTable)
      .where(and(eq(couponsTable.type, "Promotion"), eq(couponsTable.active, true)));

    for (const promo of promotions) {
      if (promo.apply === "Product" && promo.productId && promo.minQty) {
        lines = lines.map(l => {
          if (l.productId === promo.productId && l.qty >= promo.minQty!) {
            const discAmt = promo.discountKind === "percent"
              ? l.lineTotal * (promo.discountValue / 100)
              : promo.discountValue;
            return { ...l, productDiscount: discAmt, productDiscountLabel: `${promo.name}` };
          }
          return l;
        });
      }
    }
  }

  // Handle coupon code
  let discountKind = existing.discountLabel ? "custom" : null;
  let discountValue: number | null = existing.discountTotal || null;
  let discountLabel: string | null = existing.discountLabel;

  if (parsed.data.couponCode !== undefined) {
    if (parsed.data.couponCode) {
      const [coupon] = await db.select().from(couponsTable)
        .where(and(eq(couponsTable.code, parsed.data.couponCode), eq(couponsTable.active, true)))
        .limit(1);
      if (coupon) {
        discountKind = coupon.discountKind;
        discountValue = coupon.discountValue;
        discountLabel = coupon.name;
      }
    } else {
      discountKind = null;
      discountValue = null;
      discountLabel = null;
    }
  }

  if (parsed.data.discountKind !== undefined) {
    discountKind = parsed.data.discountKind ?? null;
    discountValue = parsed.data.discountValue ?? null;
    discountLabel = parsed.data.discountLabel ?? null;
  }

  const calcs = calcOrder(lines, discountKind, discountValue);

  const updateData: Partial<typeof ordersTable.$inferInsert> = {
    lines: lines as any,
    subtotal: calcs.subtotal,
    tax: calcs.tax,
    discountTotal: calcs.discountTotal,
    discountLabel: discountLabel ?? calcs.discountLabel,
    total: calcs.total,
  };

  if (parsed.data.customerId !== undefined) updateData.customerId = parsed.data.customerId ?? null;
  if (parsed.data.tableId !== undefined) updateData.tableId = parsed.data.tableId ?? null;

  const [order] = await db.update(ordersTable).set(updateData).where(eq(ordersTable.id, params.data.id)).returning();
  res.json(await enrichOrder(order));
});

router.delete("/orders/:id", requireAuth, async (req, res) => {
  const params = DeleteOrderParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(ordersTable).where(and(eq(ordersTable.id, params.data.id), eq(ordersTable.status, "Draft")));
  res.status(204).end();
});

router.post("/orders/:id/pay", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const parsed = PayOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }

  const [order] = await db.update(ordersTable).set({
    status: "Paid",
    paymentMethodId: parsed.data.paymentMethodId,
    paymentRef: parsed.data.paymentRef ?? null,
    amountPaid: parsed.data.amountPaid ?? null,
  }).where(eq(ordersTable.id, id)).returning();

  if (!order) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await enrichOrder(order));
});

router.post("/orders/:id/send-kitchen", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id)).limit(1);
  if (!order) { res.status(404).json({ error: "Not found" }); return; }

  const lines = (order.lines as CartLine[]) ?? [];
  const kitchenItems = lines.filter(l => {
    // Include all lines (in a real app you'd filter by sendToKitchen product flag)
    return true;
  }).map(l => ({
    productId: l.productId,
    productName: l.productName,
    qty: l.qty,
    done: false,
  }));

  if (kitchenItems.length > 0) {
    await db.insert(kdsTicketsTable).values({
      orderId: order.id,
      orderNumber: order.number,
      items: kitchenItems as any,
      stage: "ToCook",
    });
  }

  const [updated] = await db.update(ordersTable).set({ sentToKitchen: true }).where(eq(ordersTable.id, id)).returning();
  res.json(await enrichOrder(updated));
});

router.post("/orders/:id/cancel", requireAuth, async (req, res) => {
  const id = parseInt(req.params.id as string);
  const [order] = await db.update(ordersTable).set({ status: "Cancelled" }).where(eq(ordersTable.id, id)).returning();
  if (!order) { res.status(404).json({ error: "Not found" }); return; }
  res.json(await enrichOrder(order));
});

export default router;
