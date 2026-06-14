import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  authApi, categoryApi, productApi, paymentApi, floorApi,
  tableApi, couponApi, customerApi, orderApi, sessionApi, kitchenApi,
  saveToken, clearToken,
} from "./api.js";
import socket from "./socket.js";

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
    apply: c.promotionType === "PRODUCT" ? "Product" : (c.promotionType === "ORDER" ? "Order" : "Order"),
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
    name: p.name || p.type,
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

          // Ensure we have a valid active backend session synced on startup
          if (get().authToken) {
            try {
              const activeSess = await sessionApi.getOpenSession();
              if (activeSess && activeSess.id) {
                if (get().currentSessionId !== activeSess.id) {
                  set({ currentSessionId: activeSess.id });
                }
              } else {
                // No open session on backend, let's open one
                await get().openSession();
              }
            } catch (err) {
              console.error("Session sync failed:", err);
              if (!get().currentSessionId) {
                const s = { id: uid(), openedAt: Date.now(), openingAmount: 0, employeeId: get().currentUserId };
                set((st) => ({ sessions: [...st.sessions, s], currentSessionId: s.id }));
              }
            }
          }

          // Fetch fresh KDS state on startup
          await get().fetchKds().catch((err) => console.error("KDS bootstrap fetch failed:", err));

          // Fetch fresh orders from backend
          await get().fetchOrders().catch((err) => console.error("Orders bootstrap fetch failed:", err));

          // Migrate legacy draft order numbers
          set((state) => ({
            orders: state.orders.map(o => {
              if (o.status === "Draft" && o.number && !o.number.startsWith("ORD-")) {
                const now = new Date(o.createdAt || Date.now());
                const d = String(now.getDate()).padStart(2, '0');
                const m = String(now.getMonth() + 1).padStart(2, '0');
                const y = now.getFullYear();
                return { ...o, number: `ORD-${d}${m}${y}${o.number.padStart(4, '0')}` };
              }
              return o;
            })
          }));
          
          // Connect real-time socket and setup listeners
          socket.connect();
          socket.off("kds:ticket-created");
          socket.off("kds:ticket-updated");
          
          socket.on("kds:ticket-created", () => {
            get().fetchKds().catch((err) => console.error("Real-time fetchKds failed:", err));
          });
          
          socket.on("kds:ticket-updated", () => {
            get().fetchKds().catch((err) => console.error("Real-time fetchKds failed:", err));
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
      // Sync-only: update local state without API call (used by admin booking page)
      syncFloor: (f) => set((s) => ({
        floors: s.floors.some((x) => x.id === f.id)
          ? s.floors.map((x) => (x.id === f.id ? f : x))
          : [...s.floors, f],
      })),
      deleteFloor: async (id) => {
        try {
          await floorApi.delete(id);
          set((s) => ({
            floors: s.floors.filter((x) => x.id !== id),
            tables: s.tables.filter((t) => t.floorId !== id),
          }));
        } catch (e) { console.error(e); }
      },
      syncDeleteFloor: (id) => set((s) => ({
        floors: s.floors.filter((x) => x.id !== id),
        tables: s.tables.filter((t) => t.floorId !== id),
      })),

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
      // Sync-only: update local state without API call (used by admin booking page)
      syncTable: (t) => set((s) => ({
        tables: s.tables.some((x) => x.id === t.id)
          ? s.tables.map((x) => (x.id === t.id ? t : x))
          : [...s.tables, t],
      })),
      deleteTable: async (id) => {
        try {
          await tableApi.delete(id);
          set((s) => ({ tables: s.tables.filter((x) => x.id !== id) }));
        } catch (e) { console.error(e); }
      },
      syncDeleteTable: (id) => set((s) => ({ tables: s.tables.filter((x) => x.id !== id) })),

      // ── Payment Methods ────────────────────────────────────
      syncPaymentMethod: (p) => set((s) => ({
        paymentMethods: s.paymentMethods.some((x) => x.id === p.id)
          ? s.paymentMethods.map((x) => (x.id === p.id ? p : x))
          : [...s.paymentMethods, p],
      })),
      syncDeletePaymentMethod: (id) => set((s) => ({
        paymentMethods: s.paymentMethods.filter((x) => x.id !== id),
      })),

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
          await sessionApi.close(sid, { closingAmount: total });
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
      createDraftOrder: (tableId, customerId = null) => {
        const id = uid();
        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const y = now.getFullYear();
        const sequence = String(get().orders.length + 1).padStart(4, "0");
        const number = `ORD-${d}${m}${y}${sequence}`;
        const o = {
          id, number, tableId, customerId,
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

        // ── Step 1: evaluate product-level promotions ─────────────
        // Find all active PRODUCT promotions
        const productPromos = s.coupons.filter(
          (c) => c.active && c.type === "Promotion" && c.apply === "Product"
        );

        let subtotal = 0;
        let tax = 0;
        let productDiscountTotal = 0;

        const newLines = o.lines.map((l) => {
          const p = products.find((x) => x.id === l.productId);
          if (!p) return l;
          const lineGross = l.qty * l.unitPrice;
          subtotal += lineGross;
          tax += (lineGross * p.tax) / 100;

          // Check if any product-level promo matches this line
          const matchedPromo = productPromos.find(
            (c) => c.productId === l.productId && l.qty >= (c.minQty ?? 1)
          );

          if (matchedPromo) {
            const discAmt =
              matchedPromo.discountKind === "percent"
                ? (lineGross * matchedPromo.discountValue) / 100
                : Math.min(matchedPromo.discountValue, lineGross);
            productDiscountTotal += discAmt;
            return {
              ...l,
              productDiscount: {
                label:
                  matchedPromo.discountKind === "percent"
                    ? `${matchedPromo.discountValue}% off on ₹${lineGross.toFixed(0)}`
                    : `₹${matchedPromo.discountValue} off on ₹${lineGross.toFixed(0)}`,
                amount: discAmt,
                promoId: matchedPromo.id,
              },
            };
          }
          // Clear stale productDiscount if promo no longer matches
          return { ...l, productDiscount: undefined };
        });

        // ── Step 2: evaluate order-level discount ──────────────────
        const baseForOrderDisc = subtotal;
        let orderDiscount = 0;
        let discountLabel;
        let appliedPromoId = null;

        const applyDisc = (kind, val, label, promoId = null) => {
          const amt = kind === "percent" ? (baseForOrderDisc * val) / 100 : val;
          orderDiscount = amt;
          discountLabel = label;
          appliedPromoId = promoId;
        };

        if (couponCode) {
          // Manual coupon code entry
          const c = s.coupons.find(
            (x) => x.active && x.type === "Coupon" && x.code?.toUpperCase() === couponCode.toUpperCase()
          );
          if (c) {
            applyDisc(
              c.discountKind,
              c.discountValue,
              `${c.code} (${c.discountKind === "percent" ? c.discountValue + "%" : "₹" + c.discountValue})`,
              c.id
            );
          }
        } else if (autoPromoId) {
          // Manually selected promo from the popup
          const c = s.coupons.find((x) => x.id === autoPromoId && x.active);
          if (c) applyDisc(c.discountKind, c.discountValue, `${c.name}`, c.id);
        } else {
          // Auto-evaluate Order-level promotions
          const validPromos = s.coupons.filter(
            (c) => c.active && c.type === "Promotion" && c.apply === "Order" && (c.minOrderAmount ?? 0) <= baseForOrderDisc
          );

          if (validPromos.length > 0) {
            // Pick highest discount
            const best = validPromos.reduce((prev, curr) => {
              const pAmt = prev.discountKind === "percent" ? (baseForOrderDisc * prev.discountValue) / 100 : prev.discountValue;
              const cAmt = curr.discountKind === "percent" ? (baseForOrderDisc * curr.discountValue) / 100 : curr.discountValue;
              return cAmt > pAmt ? curr : prev;
            });
            applyDisc(best.discountKind, best.discountValue, best.name, best.id);
          }
        }

        const discountTotal = productDiscountTotal + orderDiscount;
        const total = subtotal + tax - discountTotal;
        set((st) => ({
          orders: st.orders.map((x) =>
            x.id === orderId
              ? {
                  ...x,
                  lines: newLines,
                  subtotal,
                  tax: Math.round(tax * 100) / 100,
                  discountTotal: Math.round(discountTotal * 100) / 100,
                  discountLabel,
                  appliedCoupon: couponCode || null,
                  appliedPromoId,
                  total: Math.round(total * 100) / 100,
                }
              : x
          ),
        }));
      },
      sendOrderToKitchen: async (orderId) => {
        const s = get();
        const o = s.orders.find((x) => x.id === orderId);
        if (!o || !o.lines.length) return;

        let sessionId = get().currentSessionId;
        if (!sessionId) {
          throw new Error("No active session. Please log out and log in again.");
        }

        try {
          let savedOrder;
          try {
            savedOrder = await orderApi.create({
              sessionId,
              tableId: o.tableId,
              customerId: o.customerId,
              employeeId: o.employeeId ?? get().currentUserId,
              items: o.lines.map((l) => ({ productId: l.productId, quantity: l.qty, unitPrice: l.unitPrice })),
            });
          } catch (firstErr) {
            // Self-healing session recovery: if backend throws session error, fetch/create session and retry
            if (firstErr.message?.toLowerCase().includes("session")) {
              console.warn("Session error during order creation, attempting session recovery...");
              const activeSess = await sessionApi.getOpenSession().catch(() => null);
              let newSessionId = activeSess?.id;
              if (!newSessionId) {
                const sess = await sessionApi.open({ userId: get().currentUserId }).catch(() => null);
                newSessionId = sess?.id;
              }
              if (newSessionId) {
                sessionId = newSessionId;
                set({ currentSessionId: newSessionId });
                // Retry creating the order
                savedOrder = await orderApi.create({
                  sessionId: newSessionId,
                  tableId: o.tableId,
                  customerId: o.customerId,
                  employeeId: o.employeeId ?? get().currentUserId,
                  items: o.lines.map((l) => ({ productId: l.productId, quantity: l.qty, unitPrice: l.unitPrice })),
                });
              } else {
                throw firstErr;
              }
            } else {
              throw firstErr;
            }
          }

          // Replace local draft ID with the real DB ID everywhere and set sentToKitchen
          set((state) => ({
            orders: state.orders.map((ord) =>
              ord.id === orderId
                ? { ...ord, id: savedOrder.id, number: savedOrder.orderNumber, sessionId, sentToKitchen: true }
                : ord
            ),
            draftOrderId: state.draftOrderId === orderId ? savedOrder.id : state.draftOrderId,
          }));

          // Fetch fresh state from KDS backend
          await get().fetchKds();
        } catch (err) {
          console.error("sendOrderToKitchen failed:", err);
          throw new Error(err.message || "Failed to create order on server");
        }
      },

      payOrder: async (orderId, paymentMethodId, amountPaid, ref) => {
        const o = get().orders.find((x) => x.id === orderId);
        if (!o) return;
        // Mark paid locally immediately
        get().updateOrder(orderId, { status: "Paid", paymentMethodId, amountPaid, paymentRef: ref });
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

      fetchKds: async () => {
        try {
          const orders = await kitchenApi.getAll();
          const groups = {};

          for (const item of orders) {
            if (!groups[item.orderId]) {
              groups[item.orderId] = {
                id: item.orderId,
                orderId: item.orderId,
                orderNumber: item.order?.orderNumber || '',
                items: [],
                stage: 'ToCook',
                createdAt: new Date(item.createdAt).getTime(),
                rawItems: [],
              };
            }
            groups[item.orderId].items.push({
              kitchenOrderId: item.id,
              productId: item.productId,
              qty: Number(item.orderItem?.quantity || 1),
              done: item.isItemCompleted || item.status === 'COMPLETED',
            });
            groups[item.orderId].rawItems.push(item);
          }

          const ticketList = Object.values(groups).map((group) => {
            const statuses = group.rawItems.map((i) => i.status);
            let stage = 'ToCook';
            if (statuses.every((s) => s === 'COMPLETED')) {
              stage = 'Completed';
            } else if (statuses.some((s) => s === 'PREPARING' || s === 'COMPLETED')) {
              stage = 'Preparing';
            } else {
              stage = 'ToCook';
            }
            group.stage = stage;
            delete group.rawItems;
            return group;
          });

          ticketList.sort((a, b) => b.createdAt - a.createdAt);
          set({ kds: ticketList });
        } catch (e) {
          console.error("fetchKds error:", e);
        }
      },

      fetchOrders: async () => {
        const sid = get().currentSessionId;
        if (!sid) return;
        try {
          const res = await orderApi.getBySession(sid);
          const raw = Array.isArray(res) ? res : [];
          
          const dbOrders = raw.map(o => ({
            id: o.id,
            number: o.orderNumber,
            sessionId: o.sessionId,
            tableId: o.tableId,
            customerId: o.customerId,
            employeeId: o.employeeId,
            status: o.status === "PAID" ? "Paid" : o.status === "CANCELLED" ? "Cancelled" : "Draft",
            subtotal: parseFloat(o.subtotal) || 0,
            tax: parseFloat(o.taxAmount) || 0,
            discountTotal: parseFloat(o.discountAmount) || 0,
            total: parseFloat(o.total) || 0,
            createdAt: o.createdAt ? new Date(o.createdAt).getTime() : Date.now(),
            sentToKitchen: o.kitchenOrders && o.kitchenOrders.length > 0,
            lines: (o.orderItems || []).map(item => ({
              productId: item.productId,
              qty: parseFloat(item.quantity) || 1,
              unitPrice: parseFloat(item.unitPrice) || 0,
              productDiscount: item.promotionId ? { promoId: item.promotionId } : undefined
            }))
          }));

          set(st => {
            const merged = [...st.orders];
            dbOrders.forEach(dbo => {
              const idx = merged.findIndex(mo => mo.id === dbo.id);
              if (idx === -1) {
                merged.push(dbo);
              } else {
                if (dbo.status !== "Draft" || merged[idx].status === "Draft") {
                  merged[idx] = { ...merged[idx], ...dbo };
                }
              }
            });
            return { orders: merged };
          });
        } catch (e) {
          console.error("fetchOrders error", e);
        }
      },

      setKdsStage: async (ticketId, stage) => {
        const ticket = get().kds.find((k) => k.id === ticketId);
        if (!ticket) return;

        // Optimistically update local stage
        set((s) => ({
          kds: s.kds.map((k) => (k.id === ticketId ? { ...k, stage } : k)),
        }));

        try {
          const mapStageToDbStatus = (stg) => {
            if (stg === 'ToCook') return 'TO_COOK';
            if (stg === 'Preparing') return 'PREPARING';
            if (stg === 'Completed') return 'COMPLETED';
            return 'TO_COOK';
          };
          const dbStatus = mapStageToDbStatus(stage);
          // For all items in the ticket, update their status on the backend sequentially
          for (const item of ticket.items) {
            await kitchenApi.updateStatus(item.kitchenOrderId, dbStatus);
          }
          await get().fetchKds();
        } catch (err) {
          console.error("setKdsStage failed:", err);
        }
      },

      toggleKdsItem: async (ticketId, productId) => {
        const ticket = get().kds.find((k) => k.id === ticketId);
        if (!ticket) return;
        const item = ticket.items.find((i) => i.productId === productId);
        if (!item) return;

        const nextDone = !item.done;

        // Optimistically update local item state
        set((s) => ({
          kds: s.kds.map((k) =>
            k.id === ticketId
              ? { ...k, items: k.items.map((i) => (i.productId === productId ? { ...i, done: nextDone } : i)) }
              : k
          ),
        }));

        try {
          if (nextDone) {
            await kitchenApi.complete(item.kitchenOrderId);
          } else {
            const mapStageToDbStatus = (stg) => {
              if (stg === 'ToCook') return 'TO_COOK';
              if (stg === 'Preparing') return 'PREPARING';
              if (stg === 'Completed') return 'COMPLETED';
              return 'TO_COOK';
            };
            const dbStatus = mapStageToDbStatus(ticket.stage);
            await kitchenApi.updateStatus(
              item.kitchenOrderId,
              dbStatus === 'COMPLETED' ? 'PREPARING' : dbStatus
            );
          }
          await get().fetchKds();
        } catch (err) {
          console.error("toggleKdsItem failed:", err);
        }
      },
    }),
    {
      name: "cafe-pos-v3",  // bumped version — clears old incompatible cache
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
