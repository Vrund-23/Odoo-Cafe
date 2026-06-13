import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  authApi, categoryApi, productApi, paymentApi, floorApi,
  tableApi, couponApi, customerApi, orderApi, sessionApi, kitchenApi,
  saveToken, clearToken,
} from "./api.js";

const uid = () => Math.random().toString(36).slice(2, 10);
const pad = (n) => String(n).padStart(5, "0");

// ─── Normalise DB rows to the shape the UI expects ───────────
function normaliseUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role === "ADMIN" ? "User" : "Employee",
    active: !u.isArchived,
    password: "", // never returned from server
  };
}
function normaliseProduct(p) {
  return {
    id: p.id,
    name: p.name,
    categoryId: p.categoryId,
    price: Number(p.price),
    unit: p.unitOfMeasure ?? "piece",
    tax: Number(p.tax ?? 0),
    description: p.description ?? "",
    imageUrl: p.imageUrl ?? null,
    sendToKitchen: p.showInKds ?? false,
  };
}
function normaliseTable(t) {
  return {
    id: t.id,
    floorId: t.floorId,
    number: Number(t.tableNumber?.replace(/\D/g, "")) || t.tableNumber,
    seats: t.seats,
    active: t.isActive,
  };
}
function normaliseOrder(o) {
  return {
    id: o.id,
    number: o.orderNumber,
    tableId: o.tableId ?? null,
    customerId: o.customerId ?? null,
    employeeId: o.employeeId,
    sessionId: o.sessionId,
    status: o.status === "PAID" ? "Paid" : o.status === "CANCELLED" ? "Cancelled" : "Draft",
    subtotal: Number(o.subtotal ?? 0),
    tax: Number(o.taxAmount ?? 0),
    discountTotal: Number(o.discountAmount ?? 0),
    total: Number(o.total ?? 0),
    paymentMethodId: o.paymentMethod ?? null,
    createdAt: new Date(o.createdAt).getTime(),
    lines: (o.orderItems ?? []).map((i) => ({
      productId: i.productId,
      qty: Number(i.quantity),
      unitPrice: Number(i.unitPrice),
    })),
  };
}
function normaliseSession(s) {
  return {
    id: s.id,
    openedAt: new Date(s.openedAt).getTime(),
    closedAt: s.closedAt ? new Date(s.closedAt).getTime() : null,
    closingAmount: s.closingAmount ? Number(s.closingAmount) : 0,
    employeeId: s.userId,
  };
}
function normaliseCoupon(c) {
  return {
    id: c.id,
    name: c.name ?? c.code,
    type: c.promotionType ? "Promotion" : "Coupon",
    code: c.code ?? null,
    apply: c.promotionType ?? "Order",
    discountKind: (c.discountType ?? "PERCENTAGE") === "PERCENTAGE" ? "percent" : "fixed",
    discountValue: Number(c.discountValue),
    minOrderAmount: c.minOrderAmount ? Number(c.minOrderAmount) : null,
    productId: c.productId ?? null,
    minQty: c.minQuantity ?? null,
    active: c.isActive,
  };
}
function normalisePayment(p) {
  return {
    id: p.id,
    name: p.type,
    type: p.type,
    upiId: p.upiId ?? null,
    active: p.isEnabled,
  };
}

export const useStore = create(
  persist(
    (set, get) => ({
      // ── Auth state ─────────────────────────────────────────
      currentUserId: null,
      currentTableId: null,
      currentSessionId: null,
      lastClosedSession: null,
      authToken: null,

      // ── Remote data ────────────────────────────────────────
      users: [],
      categories: [],
      products: [],
      paymentMethods: [],
      floors: [],
      tables: [],
      coupons: [],
      customers: [],
      orders: [],
      sessions: [],
      kds: [],
      draftOrderId: null,
      searchQuery: "",
      loading: false,
      bootstrapped: false,

      setSearchQuery: (query) => set({ searchQuery: query }),

      // ── Bootstrap: load all reference data from DB ─────────
      bootstrap: async () => {
        if (get().bootstrapped) return;
        set({ loading: true });
        try {
          const [cats, prods, floors, tables, payments, coupons, customers, users] =
            await Promise.all([
              categoryApi.getAll().catch(() => []),
              productApi.getAll().catch(() => []),
              floorApi.getAll().catch(() => []),
              tableApi.getAll().catch(() => []),
              paymentApi.getAll().catch(() => []),
              couponApi.getAll().catch(() => []),
              customerApi.getAll().catch(() => []),
              authApi.getAllUsers().catch(() => []),
            ]);

          set({
            categories: Array.isArray(cats) ? cats : [],
            products: Array.isArray(prods) ? prods.map(normaliseProduct) : [],
            floors: Array.isArray(floors) ? floors : [],
            tables: Array.isArray(tables) ? tables.map(normaliseTable) : [],
            paymentMethods: Array.isArray(payments) ? payments.map(normalisePayment) : [],
            coupons: Array.isArray(coupons) ? (coupons.coupons ?? coupons).map(normaliseCoupon) : [],
            customers: Array.isArray(customers) ? customers : [],
            users: Array.isArray(users)
              ? users.map(normaliseUser)
              : (users.users ?? []).map(normaliseUser),
            bootstrapped: true,
            loading: false,
          });
        } catch (e) {
          console.error("Bootstrap error:", e);
          set({ loading: false });
        }
      },

      // ── Auth ───────────────────────────────────────────────
      login: async (email, password) => {
        try {
          const result = await authApi.login(email, password);
          const user = normaliseUser(result.user ?? result);
          const token = result.token ?? result.accessToken ?? null;
          if (token) {
            saveToken(token);
            set({ authToken: token });
          }
          set({ currentUserId: user.id, users: [user] });
          // Load all data after login
          set({ bootstrapped: false });
          await get().bootstrap();
          return user;
        } catch {
          return null;
        }
      },
      logout: () => {
        clearToken();
        set({
          currentUserId: null,
          currentTableId: null,
          currentSessionId: null,
          authToken: null,
          bootstrapped: false,
        });
      },

      // ── Categories ─────────────────────────────────────────
      upsertCategory: async (c) => {
        try {
          const saved = c.id && !c.id.startsWith("c-")
            ? await categoryApi.update(c.id, c)
            : await categoryApi.create(c);
          set((s) => ({
            categories: s.categories.some((x) => x.id === saved.id)
              ? s.categories.map((x) => (x.id === saved.id ? saved : x))
              : [...s.categories, saved],
          }));
        } catch (e) {
          console.error(e);
          throw e;
        }
      },
      deleteCategory: async (id) => {
        try {
          await categoryApi.delete(id);
          set((s) => ({ categories: s.categories.filter((x) => x.id !== id) }));
        } catch (e) { console.error(e); }
      },

      // ── Products ───────────────────────────────────────────
      upsertProduct: async (p) => {
        try {
          const payload = {
            name: p.name,
            categoryId: p.categoryId,
            price: p.price,
            unitOfMeasure: p.unit,
            tax: p.tax,
            description: p.description,
            imageUrl: p.imageUrl,
            showInKds: p.sendToKitchen,
          };
          const saved = p.id && !p.id.startsWith("p-")
            ? await productApi.update(p.id, payload)
            : await productApi.create(payload);
          const norm = normaliseProduct(saved);
          set((s) => ({
            products: s.products.some((x) => x.id === norm.id)
              ? s.products.map((x) => (x.id === norm.id ? norm : x))
              : [...s.products, norm],
          }));
        } catch (e) {
          console.error(e);
          throw e;
        }
      },
      deleteProduct: async (id) => {
        try {
          await productApi.delete(id);
          set((s) => ({ products: s.products.filter((x) => x.id !== id) }));
        } catch (e) { console.error(e); }
      },

      // ── Payment Methods ────────────────────────────────────
      upsertPaymentMethod: async (p) => {
        try {
          const saved = p.id ? await paymentApi.update(p.id, p) : await paymentApi.create(p);
          const norm = normalisePayment(saved);
          set((s) => ({
            paymentMethods: s.paymentMethods.some((x) => x.id === norm.id)
              ? s.paymentMethods.map((x) => (x.id === norm.id ? norm : x))
              : [...s.paymentMethods, norm],
          }));
        } catch (e) { console.error(e); }
      },
      deletePaymentMethod: async (id) => {
        try {
          await paymentApi.delete(id);
          set((s) => ({ paymentMethods: s.paymentMethods.filter((x) => x.id !== id) }));
        } catch (e) { console.error(e); }
      },

      // ── Floors ─────────────────────────────────────────────
      upsertFloor: async (f) => {
        try {
          const saved = f.id ? await floorApi.update(f.id, f) : await floorApi.create(f);
          set((s) => ({
            floors: s.floors.some((x) => x.id === saved.id)
              ? s.floors.map((x) => (x.id === saved.id ? saved : x))
              : [...s.floors, saved],
          }));
        } catch (e) { console.error(e); }
      },
      deleteFloor: async (id) => {
        try {
          await floorApi.delete(id);
          set((s) => ({
            floors: s.floors.filter((x) => x.id !== id),
            tables: s.tables.filter((t) => t.floorId !== id),
          }));
        } catch (e) { console.error(e); }
      },

      // ── Tables ─────────────────────────────────────────────
      upsertTable: async (t) => {
        try {
          const payload = {
            floorId: t.floorId,
            tableNumber: String(t.number),
            seats: t.seats,
            isActive: t.active,
          };
          const saved = t.id ? await tableApi.update(t.id, payload) : await tableApi.create(payload);
          const norm = normaliseTable(saved);
          set((s) => ({
            tables: s.tables.some((x) => x.id === norm.id)
              ? s.tables.map((x) => (x.id === norm.id ? norm : x))
              : [...s.tables, norm],
          }));
        } catch (e) { console.error(e); }
      },
      deleteTable: async (id) => {
        try {
          await tableApi.delete(id);
          set((s) => ({ tables: s.tables.filter((x) => x.id !== id) }));
        } catch (e) { console.error(e); }
      },

      // ── Coupons ────────────────────────────────────────────
      upsertCoupon: async (c) => {
        try {
          // Map UI fields → DB fields
          const discountType = c.discountKind === "percent" ? "PERCENTAGE" : "FIXED";
          const isPromotion = c.type === "Promotion";
          const payload = {
            name: c.name,
            code: c.code || undefined,
            discountType,
            discountValue: c.discountValue,
            isActive: c.active,
            ...(isPromotion && {
              promotionType: c.apply === "Product" ? "PRODUCT" : "ORDER",
              productId: c.productId || null,
              minQuantity: c.minQty ?? null,
              minOrderAmount: c.minOrderAmount ?? null,
            }),
          };
          const isNew = !c.id || c.id.startsWith("co-");
          const saved = isNew
            ? await couponApi.create(payload)
            : await couponApi.update(c.id, payload);
          const norm = normaliseCoupon(saved);
          set((s) => ({
            coupons: isNew
              ? [...s.coupons.filter((x) => x.id !== c.id), norm]
              : s.coupons.map((x) => (x.id === norm.id ? norm : x)),
          }));
        } catch (e) {
          console.error("upsertCoupon error:", e);
          throw e;
        }
      },
      deleteCoupon: async (id) => {
        try {
          await couponApi.delete(id);
          set((s) => ({ coupons: s.coupons.filter((x) => x.id !== id) }));
        } catch (e) { console.error(e); }
      },

      // ── Customers ──────────────────────────────────────────
      upsertCustomer: async (c) => {
        try {
          const saved = c.id ? await customerApi.update(c.id, c) : await customerApi.create(c);
          set((s) => ({
            customers: s.customers.some((x) => x.id === saved.id)
              ? s.customers.map((x) => (x.id === saved.id ? saved : x))
              : [...s.customers, saved],
          }));
        } catch (e) { console.error(e); }
      },
      deleteCustomer: async (id) => {
        try {
          await customerApi.delete(id);
          set((s) => ({ customers: s.customers.filter((x) => x.id !== id) }));
        } catch (e) { console.error(e); }
      },

      // ── Users ──────────────────────────────────────────────
      upsertUser: async (u) => {
        try {
          const saved = u.id ? await authApi.updateUser(u.id, u) : await authApi.register(u);
          const norm = normaliseUser(saved.user ?? saved);
          set((s) => ({
            users: s.users.some((x) => x.id === norm.id)
              ? s.users.map((x) => (x.id === norm.id ? norm : x))
              : [...s.users, norm],
          }));
        } catch (e) { console.error(e); }
      },
      deleteUser: async (id) => {
        try {
          await authApi.deleteUser(id);
          set((s) => ({ users: s.users.filter((x) => x.id !== id) }));
        } catch (e) { console.error(e); }
      },
      archiveUser: async (id) => {
        try {
          const u = get().users.find((x) => x.id === id);
          if (!u) return;
          await authApi.updateUser(id, { isArchived: u.active });
          set((s) => ({
            users: s.users.map((x) => (x.id === id ? { ...x, active: !x.active } : x)),
          }));
        } catch (e) { console.error(e); }
      },
      changePassword: async (id, pwd) => {
        try {
          await authApi.updateUser(id, { password: pwd });
        } catch (e) { console.error(e); }
      },

      // ── Sessions ───────────────────────────────────────────
      openSession: async () => {
        const uid_ = get().currentUserId;
        if (!uid_) return;
        try {
          const sess = await sessionApi.open({ userId: uid_ });
          const norm = normaliseSession(sess);
          set((s) => ({
            sessions: [...s.sessions, norm],
            currentSessionId: norm.id,
          }));
        } catch {
          // fallback local session
          const s = { id: uid(), openedAt: Date.now(), openingAmount: 0, employeeId: uid_ };
          set((st) => ({ sessions: [...st.sessions, s], currentSessionId: s.id }));
        }
      },
      closeSession: async () => {
        const sid = get().currentSessionId;
        if (!sid) return;
        const total = get()
          .orders.filter((o) => o.sessionId === sid && o.status === "Paid")
          .reduce((s, o) => s + o.total, 0);
        try {
          await sessionApi.close(sid);
        } catch { /* best effort */ }
        set((s) => ({
          sessions: s.sessions.map((x) =>
            x.id === sid ? { ...x, closedAt: Date.now(), closingAmount: total } : x
          ),
          currentSessionId: null,
          lastClosedSession: { date: Date.now(), amount: total },
        }));
      },

      // ── Tables (UI only state) ─────────────────────────────
      setCurrentTable: (id) => set({ currentTableId: id }),

      // ── Orders (local for now, sync on pay) ───────────────
      createDraftOrder: (tableId) => {
        const id = uid();
        const number = pad(get().orders.length + 1);
        const o = {
          id, number, tableId,
          lines: [], subtotal: 0, tax: 0,
          discountTotal: 0, total: 0,
          status: "Draft",
          createdAt: Date.now(),
          employeeId: get().currentUserId ?? undefined,
          sessionId: get().currentSessionId ?? undefined,
        };
        set({ orders: [o, ...get().orders], draftOrderId: id });
        return id;
      },
      setDraftOrder: (id) => set({ draftOrderId: id }),
      updateOrder: (id, patch) =>
        set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)) })),
      deleteOrder: (id) =>
        set((s) => ({
          orders: s.orders.filter((o) => o.id !== id),
          draftOrderId: s.draftOrderId === id ? null : s.draftOrderId,
        })),

      addLine: (orderId, productId) => {
        const p = get().products.find((x) => x.id === productId);
        if (!p) return;
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== orderId) return o;
            const ex = o.lines.find((l) => l.productId === productId);
            const lines = ex
              ? o.lines.map((l) => (l.productId === productId ? { ...l, qty: l.qty + 1 } : l))
              : [...o.lines, { productId, qty: 1, unitPrice: p.price }];
            return { ...o, lines };
          }),
        }));
        get().recalcOrder(orderId);
      },
      setLineQty: (orderId, productId, qty) => {
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== orderId) return o;
            const lines =
              qty <= 0
                ? o.lines.filter((l) => l.productId !== productId)
                : o.lines.map((l) => (l.productId === productId ? { ...l, qty } : l));
            return { ...o, lines };
          }),
        }));
        get().recalcOrder(orderId);
      },
      removeLine: (orderId, productId) => get().setLineQty(orderId, productId, 0),

      recalcOrder: (orderId, couponCode, autoPromoId) => {
        const s = get();
        const o = s.orders.find((x) => x.id === orderId);
        if (!o) return;
        const products = s.products;
        let subtotal = 0, tax = 0, productDiscountTotal = 0;
        const newLines = o.lines.map((l) => {
          const p = products.find((x) => x.id === l.productId);
          if (!p) return l;
          const line = l.qty * l.unitPrice;
          subtotal += line;
          tax += (line * p.tax) / 100;
          const promo = s.coupons.find(
            (c) => c.active && c.type === "Promotion" && c.apply === "Product" && c.productId === p.id && (c.minQty ?? 0) <= l.qty
          );
          if (promo) {
            const amt = promo.discountKind === "percent" ? (line * promo.discountValue) / 100 : promo.discountValue;
            productDiscountTotal += amt;
            return { ...l, productDiscount: { label: `${promo.discountValue}${promo.discountKind === "percent" ? "%" : "₹"} off`, amount: amt } };
          }
          return { ...l, productDiscount: undefined };
        });

        let orderDiscount = 0, discountLabel;
        const baseForOrderDisc = subtotal - productDiscountTotal;
        const applyDisc = (kind, val, label) => {
          const amt = kind === "percent" ? (baseForOrderDisc * val) / 100 : val;
          orderDiscount = amt;
          discountLabel = label;
        };
        if (couponCode) {
          const c = s.coupons.find((x) => x.active && x.type === "Coupon" && x.code?.toUpperCase() === couponCode.toUpperCase());
          if (c) applyDisc(c.discountKind, c.discountValue, `${c.code} (${c.discountValue}${c.discountKind === "percent" ? "%" : "₹"})`);
        } else if (autoPromoId) {
          const c = s.coupons.find((x) => x.id === autoPromoId && x.active);
          if (c) applyDisc(c.discountKind, c.discountValue, `${c.name}`);
        } else {
          const promo = s.coupons.find(
            (c) => c.active && c.type === "Promotion" && c.apply === "Order" && (c.minOrderAmount ?? 0) <= baseForOrderDisc
          );
          if (promo) applyDisc(promo.discountKind, promo.discountValue, `${promo.name}`);
        }
        const discountTotal = productDiscountTotal + orderDiscount;
        const total = subtotal + tax - discountTotal;
        set((st) => ({
          orders: st.orders.map((x) =>
            x.id === orderId
              ? { ...x, lines: newLines, subtotal, tax: Math.round(tax * 100) / 100, discountTotal: Math.round(discountTotal * 100) / 100, discountLabel, total: Math.round(total * 100) / 100 }
              : x
          ),
        }));
      },
      sendOrderToKitchen: async (orderId) => {
        const s = get();
        const o = s.orders.find((x) => x.id === orderId);
        if (!o || !o.lines.length) return;

        // Send ALL items to the KDS (kitchen staff sees everything)
        const items = o.lines.map((l) => ({
          productId: l.productId,
          qty: l.qty,
          done: false,
        }));

        // Always write to local KDS immediately (optimistic update)
        const prevKds = get().kds.filter((k) => k.orderId !== orderId);
        const localTicket = {
          id: uid(),
          orderId,
          orderNumber: o.number,
          items,
          stage: "ToCook",
          createdAt: Date.now(),
        };
        set({ kds: [localTicket, ...prevKds] });
        get().updateOrder(orderId, { sentToKitchen: true });

        // Then try to persist to DB in the background
        try {
          const sessionId = o.sessionId ?? get().currentSessionId;
          if (!sessionId) throw new Error("No active session");

          const savedOrder = await orderApi.create({
            sessionId,
            tableId: o.tableId,
            employeeId: o.employeeId ?? get().currentUserId,
            items: o.lines.map((l) => ({ productId: l.productId, quantity: l.qty, unitPrice: l.unitPrice })),
          });

          // Replace local draft ID with the real DB ID everywhere
          set((state) => ({
            orders: state.orders.map((ord) =>
              ord.id === orderId
                ? { ...ord, id: savedOrder.id, number: savedOrder.orderNumber, sentToKitchen: true }
                : ord
            ),
            draftOrderId: state.draftOrderId === orderId ? savedOrder.id : state.draftOrderId,
            // Also update the KDS ticket orderId/orderNumber
            kds: state.kds.map((k) =>
              k.orderId === orderId
                ? { ...k, orderId: savedOrder.id, orderNumber: savedOrder.orderNumber }
                : k
            ),
          }));
        } catch (err) {
          console.error("sendOrderToKitchen DB sync failed (local KDS still active):", err);
        }
      },

      payOrder: async (orderId, paymentMethodId, amountPaid, ref) => {
        const o = get().orders.find((x) => x.id === orderId);
        if (!o) return;
        // Mark paid locally immediately
        get().updateOrder(orderId, { status: "Paid", paymentMethodId, amountPaid, paymentRef: ref });
        set({ draftOrderId: null, currentTableId: null });
        try {
          const isDbOrder = orderId.length > 15; // UUID is 36 chars, local uid() is 8 chars
          if (isDbOrder) {
            // PUT /orders/:id/status
            await orderApi.update(orderId, { status: "PAID", paymentMethod: paymentMethodId, paymentReference: ref });
          } else {
            const sessionId = o.sessionId ?? get().currentSessionId;
            if (sessionId) {
              // Create new order directly with PAID status
              await orderApi.create({
                sessionId,
                tableId: o.tableId,
                employeeId: o.employeeId ?? get().currentUserId,
                items: o.lines.map((l) => ({ productId: l.productId, quantity: l.qty, unitPrice: l.unitPrice })),
              });
            }
          }
        } catch (err) {
          console.error("Failed to sync payment to server:", err);
        }
      },

      setKdsStage: (ticketId, stage) =>
        set((s) => ({ kds: s.kds.map((k) => (k.id === ticketId ? { ...k, stage } : k)) })),
      toggleKdsItem: (ticketId, productId) =>
        set((s) => ({
          kds: s.kds.map((k) =>
            k.id === ticketId
              ? { ...k, items: k.items.map((i) => (i.productId === productId ? { ...i, done: !i.done } : i)) }
              : k
          ),
        })),
    }),
    {
      name: "cafe-pos-v2",  // bumped version — clears old incompatible cache
      partialize: (s) => ({
        currentUserId: s.currentUserId,
        currentTableId: s.currentTableId,
        currentSessionId: s.currentSessionId,
        lastClosedSession: s.lastClosedSession,
        authToken: s.authToken,
        orders: s.orders,
        sessions: s.sessions,
        kds: s.kds,
        draftOrderId: s.draftOrderId,
      }),
    },
  )
);
