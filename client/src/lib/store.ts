import { create } from "zustand";
import { persist } from "zustand/middleware";

// ============ Types ============
export type Role = "User" | "Employee";
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  active: boolean;
}
export interface Category {
  id: string;
  name: string;
  color: string;
}
export interface Product {
  id: string;
  name: string;
  categoryId: string;
  price: number;
  unit: string;
  tax: number;
  description?: string;
  sendToKitchen?: boolean;
}
export type PaymentType = "Cash" | "Card" | "UPI";
export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentType;
  upiId?: string;
  active: boolean;
}
export interface Floor {
  id: string;
  name: string;
}
export interface RTable {
  id: string;
  floorId: string;
  number: number;
  seats: number;
  active: boolean;
}
export type CouponType = "Coupon" | "Promotion";
export type DiscountKind = "percent" | "amount";
export type PromotionApply = "Product" | "Order";
export interface Coupon {
  id: string;
  name: string;
  type: CouponType;
  code?: string;
  discountKind: DiscountKind;
  discountValue: number;
  active: boolean;
  apply?: PromotionApply;
  productId?: string;
  minQty?: number;
  minOrderAmount?: number;
  description?: string;
}
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}
export interface CartLine {
  productId: string;
  qty: number;
  unitPrice: number;
  productDiscount?: { label: string; amount: number };
}
export type OrderStatus = "Draft" | "Paid" | "Cancelled";
export type KdsStage = "ToCook" | "Preparing" | "Completed";
export interface KdsItem {
  productId: string;
  qty: number;
  done: boolean;
}
export interface KdsTicket {
  id: string;
  orderId: string;
  orderNumber: string;
  items: KdsItem[];
  stage: KdsStage;
  createdAt: number;
}
export interface Order {
  id: string;
  number: string;
  tableId?: string;
  customerId?: string;
  lines: CartLine[];
  subtotal: number;
  tax: number;
  discountTotal: number;
  discountLabel?: string;
  total: number;
  status: OrderStatus;
  paymentMethodId?: string;
  paymentRef?: string;
  amountPaid?: number;
  createdAt: number;
  employeeId?: string;
  sessionId?: string;
  sentToKitchen?: boolean;
}
export interface Session {
  id: string;
  openedAt: number;
  closedAt?: number;
  openingAmount: number;
  closingAmount?: number;
  employeeId: string;
}

interface State {
  currentUserId: string | null;
  currentTableId: string | null;
  currentSessionId: string | null;
  lastClosedSession: { date: number; amount: number } | null;
  users: User[];
  categories: Category[];
  products: Product[];
  paymentMethods: PaymentMethod[];
  floors: Floor[];
  tables: RTable[];
  coupons: Coupon[];
  customers: Customer[];
  orders: Order[];
  sessions: Session[];
  kds: KdsTicket[];
  draftOrderId: string | null;

  // actions
  login: (email: string, password: string) => User | null;
  signup: (name: string, email: string, password: string) => User | null;
  logout: () => void;

  upsertCategory: (c: Category) => void;
  deleteCategory: (id: string) => void;

  upsertProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;

  upsertPaymentMethod: (p: PaymentMethod) => void;
  deletePaymentMethod: (id: string) => void;

  upsertFloor: (f: Floor) => void;
  deleteFloor: (id: string) => void;
  upsertTable: (t: RTable) => void;
  deleteTable: (id: string) => void;

  upsertCoupon: (c: Coupon) => void;
  deleteCoupon: (id: string) => void;

  upsertCustomer: (c: Customer) => void;
  deleteCustomer: (id: string) => void;

  upsertUser: (u: User) => void;
  deleteUser: (id: string) => void;
  archiveUser: (id: string) => void;
  changePassword: (id: string, pwd: string) => void;

  openSession: () => void;
  closeSession: () => void;

  setCurrentTable: (id: string | null) => void;
  createDraftOrder: (tableId?: string) => string;
  setDraftOrder: (id: string | null) => void;
  updateOrder: (id: string, patch: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  addLine: (orderId: string, productId: string) => void;
  setLineQty: (orderId: string, productId: string, qty: number) => void;
  removeLine: (orderId: string, productId: string) => void;
  recalcOrder: (orderId: string, couponCode?: string | null, autoPromoId?: string | null) => void;
  sendOrderToKitchen: (orderId: string) => void;
  payOrder: (orderId: string, paymentMethodId: string, amountPaid: number, ref?: string) => void;

  setKdsStage: (ticketId: string, stage: KdsStage) => void;
  toggleKdsItem: (ticketId: string, productId: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const pad = (n: number) => String(n).padStart(5, "0");

// ============ Seed ============
const seedUsers: User[] = [
  { id: "u-admin", name: "Admin", email: "admin@cafe.com", password: "admin", role: "User", active: true },
  { id: "u-eric", name: "Eric", email: "eric@cafe.com", password: "eric", role: "Employee", active: true },
];
const seedCategories: Category[] = [
  { id: "c-chaat", name: "Chaat", color: "#F59E0B" },
  { id: "c-desert", name: "Dessert", color: "#EC4899" },
  { id: "c-meal", name: "Meal", color: "#10B981" },
  { id: "c-bev", name: "Beverages", color: "#3B82F6" },
];
const seedProducts: Product[] = [
  { id: "p1", name: "Masala Tea", categoryId: "c-bev", price: 40, unit: "piece", tax: 5, sendToKitchen: true },
  { id: "p2", name: "Coffee", categoryId: "c-bev", price: 60, unit: "piece", tax: 5, sendToKitchen: true },
  { id: "p3", name: "Lassi", categoryId: "c-bev", price: 80, unit: "piece", tax: 5, sendToKitchen: true },
  { id: "p4", name: "Cheese Burger", categoryId: "c-meal", price: 120, unit: "piece", tax: 5, sendToKitchen: true },
  { id: "p5", name: "Pani Puri", categoryId: "c-chaat", price: 50, unit: "piece", tax: 5, sendToKitchen: true },
  { id: "p6", name: "Bhel Puri", categoryId: "c-chaat", price: 60, unit: "piece", tax: 5, sendToKitchen: true },
  { id: "p7", name: "Gulab Jamun", categoryId: "c-desert", price: 45, unit: "piece", tax: 5, sendToKitchen: true },
  { id: "p8", name: "Ice Cream", categoryId: "c-desert", price: 90, unit: "piece", tax: 5, sendToKitchen: true },
  { id: "p9", name: "Veg Thali", categoryId: "c-meal", price: 180, unit: "piece", tax: 5, sendToKitchen: true },
];
const seedPayments: PaymentMethod[] = [
  { id: "pm-cash", name: "Cash", type: "Cash", active: true },
  { id: "pm-card", name: "Card", type: "Card", active: true },
  { id: "pm-upi", name: "UPI - Merchant", type: "UPI", upiId: "cafe@ybl", active: true },
];
const seedFloors: Floor[] = [{ id: "f-main", name: "Main Hall" }];
const seedTables: RTable[] = Array.from({ length: 16 }, (_, i) => ({
  id: `t-${i + 1}`,
  floorId: "f-main",
  number: i + 1,
  seats: 4,
  active: true,
}));
const seedCoupons: Coupon[] = [
  { id: "co1", name: "Summer Sale", type: "Coupon", code: "SUMMER20", discountKind: "percent", discountValue: 20, active: true },
  { id: "co2", name: "Order 500+", type: "Promotion", apply: "Order", minOrderAmount: 500, discountKind: "percent", discountValue: 10, active: true },
];
const seedCustomers: Customer[] = [
  { id: "cu1", name: "Eric Smith", email: "eric@odoo.com", phone: "+91 9898989898" },
  { id: "cu2", name: "Alex", email: "alex@odoo.com", phone: "+91 9000000001" },
];

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      currentUserId: null,
      currentTableId: null,
      currentSessionId: null,
      lastClosedSession: null,
      users: seedUsers,
      categories: seedCategories,
      products: seedProducts,
      paymentMethods: seedPayments,
      floors: seedFloors,
      tables: seedTables,
      coupons: seedCoupons,
      customers: seedCustomers,
      orders: [],
      sessions: [],
      kds: [],
      draftOrderId: null,

      login: (email, password) => {
        const u = get().users.find((x) => x.email === email && x.password === password && x.active);
        if (u) set({ currentUserId: u.id });
        return u ?? null;
      },
      signup: (name, email, password) => {
        if (get().users.some((u) => u.email === email)) return null;
        const u: User = { id: uid(), name, email, password, role: "User", active: true };
        set({ users: [...get().users, u], currentUserId: u.id });
        return u;
      },
      logout: () => set({ currentUserId: null, currentTableId: null }),

      upsertCategory: (c) =>
        set((s) => ({
          categories: s.categories.some((x) => x.id === c.id)
            ? s.categories.map((x) => (x.id === c.id ? c : x))
            : [...s.categories, c],
        })),
      deleteCategory: (id) => set((s) => ({ categories: s.categories.filter((x) => x.id !== id) })),

      upsertProduct: (p) =>
        set((s) => ({
          products: s.products.some((x) => x.id === p.id)
            ? s.products.map((x) => (x.id === p.id ? p : x))
            : [...s.products, p],
        })),
      deleteProduct: (id) => set((s) => ({ products: s.products.filter((x) => x.id !== id) })),

      upsertPaymentMethod: (p) =>
        set((s) => ({
          paymentMethods: s.paymentMethods.some((x) => x.id === p.id)
            ? s.paymentMethods.map((x) => (x.id === p.id ? p : x))
            : [...s.paymentMethods, p],
        })),
      deletePaymentMethod: (id) =>
        set((s) => ({ paymentMethods: s.paymentMethods.filter((x) => x.id !== id) })),

      upsertFloor: (f) =>
        set((s) => ({
          floors: s.floors.some((x) => x.id === f.id) ? s.floors.map((x) => (x.id === f.id ? f : x)) : [...s.floors, f],
        })),
      deleteFloor: (id) =>
        set((s) => ({
          floors: s.floors.filter((x) => x.id !== id),
          tables: s.tables.filter((t) => t.floorId !== id),
        })),
      upsertTable: (t) =>
        set((s) => ({
          tables: s.tables.some((x) => x.id === t.id) ? s.tables.map((x) => (x.id === t.id ? t : x)) : [...s.tables, t],
        })),
      deleteTable: (id) => set((s) => ({ tables: s.tables.filter((x) => x.id !== id) })),

      upsertCoupon: (c) =>
        set((s) => ({
          coupons: s.coupons.some((x) => x.id === c.id) ? s.coupons.map((x) => (x.id === c.id ? c : x)) : [...s.coupons, c],
        })),
      deleteCoupon: (id) => set((s) => ({ coupons: s.coupons.filter((x) => x.id !== id) })),

      upsertCustomer: (c) =>
        set((s) => ({
          customers: s.customers.some((x) => x.id === c.id)
            ? s.customers.map((x) => (x.id === c.id ? c : x))
            : [...s.customers, c],
        })),
      deleteCustomer: (id) => set((s) => ({ customers: s.customers.filter((x) => x.id !== id) })),

      upsertUser: (u) =>
        set((s) => ({
          users: s.users.some((x) => x.id === u.id) ? s.users.map((x) => (x.id === u.id ? u : x)) : [...s.users, u],
        })),
      deleteUser: (id) => set((s) => ({ users: s.users.filter((x) => x.id !== id) })),
      archiveUser: (id) =>
        set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, active: !u.active } : u)) })),
      changePassword: (id, pwd) =>
        set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, password: pwd } : u)) })),

      openSession: () => {
        const uidNow = get().currentUserId ?? "u-admin";
        const sess: Session = { id: uid(), openedAt: Date.now(), openingAmount: 0, employeeId: uidNow };
        set({ sessions: [...get().sessions, sess], currentSessionId: sess.id });
      },
      closeSession: () => {
        const sid = get().currentSessionId;
        if (!sid) return;
        const total = get()
          .orders.filter((o) => o.sessionId === sid && o.status === "Paid")
          .reduce((s, o) => s + o.total, 0);
        set((s) => ({
          sessions: s.sessions.map((x) => (x.id === sid ? { ...x, closedAt: Date.now(), closingAmount: total } : x)),
          currentSessionId: null,
          lastClosedSession: { date: Date.now(), amount: total },
        }));
      },

      setCurrentTable: (id) => set({ currentTableId: id }),
      createDraftOrder: (tableId) => {
        const id = uid();
        const number = pad(get().orders.length + 1);
        const o: Order = {
          id,
          number,
          tableId,
          lines: [],
          subtotal: 0,
          tax: 0,
          discountTotal: 0,
          total: 0,
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
            const lines = qty <= 0
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
        let subtotal = 0;
        let tax = 0;
        let productDiscountTotal = 0;
        const newLines = o.lines.map((l) => {
          const p = products.find((x) => x.id === l.productId);
          if (!p) return l;
          const line = l.qty * l.unitPrice;
          subtotal += line;
          tax += (line * p.tax) / 100;
          // product-level promotion
          const promo = s.coupons.find(
            (c) => c.active && c.type === "Promotion" && c.apply === "Product" && c.productId === p.id && (c.minQty ?? 0) <= l.qty,
          );
          if (promo) {
            const amt =
              promo.discountKind === "percent" ? (line * promo.discountValue) / 100 : promo.discountValue;
            productDiscountTotal += amt;
            return {
              ...l,
              productDiscount: {
                label: `${promo.discountValue}${promo.discountKind === "percent" ? "%" : "₹"} off`,
                amount: amt,
              },
            };
          }
          return { ...l, productDiscount: undefined };
        });

        // order-level discount: coupon code OR automated promotion OR explicit
        let orderDiscount = 0;
        let discountLabel: string | undefined;
        const baseForOrderDisc = subtotal - productDiscountTotal;

        const applyDisc = (kind: DiscountKind, val: number, label: string) => {
          const amt = kind === "percent" ? (baseForOrderDisc * val) / 100 : val;
          orderDiscount = amt;
          discountLabel = label;
        };

        if (couponCode) {
          const c = s.coupons.find(
            (x) => x.active && x.type === "Coupon" && x.code?.toUpperCase() === couponCode.toUpperCase(),
          );
          if (c) applyDisc(c.discountKind, c.discountValue, `${c.code} (${c.discountValue}${c.discountKind === "percent" ? "%" : "₹"})`);
        } else if (autoPromoId) {
          const c = s.coupons.find((x) => x.id === autoPromoId && x.active);
          if (c) applyDisc(c.discountKind, c.discountValue, `${c.name}`);
        } else {
          // auto-apply order promotion if min met
          const promo = s.coupons.find(
            (c) =>
              c.active &&
              c.type === "Promotion" &&
              c.apply === "Order" &&
              (c.minOrderAmount ?? 0) <= baseForOrderDisc,
          );
          if (promo) applyDisc(promo.discountKind, promo.discountValue, `${promo.name}`);
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
                  total: Math.round(total * 100) / 100,
                }
              : x,
          ),
        }));
      },

      sendOrderToKitchen: (orderId) => {
        const s = get();
        const o = s.orders.find((x) => x.id === orderId);
        if (!o) return;
        const items: KdsItem[] = o.lines
          .map((l) => {
            const p = s.products.find((p) => p.id === l.productId);
            return p?.sendToKitchen ? { productId: l.productId, qty: l.qty, done: false } : null;
          })
          .filter(Boolean) as KdsItem[];
        if (!items.length) return;
        // replace existing ticket for this order
        const filtered = s.kds.filter((k) => k.orderId !== orderId);
        const ticket: KdsTicket = {
          id: uid(),
          orderId,
          orderNumber: o.number,
          items,
          stage: "ToCook",
          createdAt: Date.now(),
        };
        set({ kds: [ticket, ...filtered] });
        get().updateOrder(orderId, { sentToKitchen: true });
      },

      payOrder: (orderId, paymentMethodId, amountPaid, ref) => {
        get().updateOrder(orderId, {
          status: "Paid",
          paymentMethodId,
          amountPaid,
          paymentRef: ref,
        });
        set({ draftOrderId: null, currentTableId: null });
      },

      setKdsStage: (ticketId, stage) =>
        set((s) => ({ kds: s.kds.map((k) => (k.id === ticketId ? { ...k, stage } : k)) })),
      toggleKdsItem: (ticketId, productId) =>
        set((s) => ({
          kds: s.kds.map((k) =>
            k.id === ticketId
              ? { ...k, items: k.items.map((i) => (i.productId === productId ? { ...i, done: !i.done } : i)) }
              : k,
          ),
        })),
    }),
    { name: "cafe-pos" },
  ),
);
