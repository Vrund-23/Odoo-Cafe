import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { format, startOfDay, startOfWeek, startOfMonth } from "date-fns";
import { Download } from "lucide-react";

export const Route = createFileRoute("/admin/reports")({ component: ReportsPage });

type Period = "today" | "week" | "month" | "all";

function ReportsPage() {
  const orders = useStore((s) => s.orders);
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const users = useStore((s) => s.users);
  const customers = useStore((s) => s.customers);
  const sessions = useStore((s) => s.sessions);

  const [period, setPeriod] = useState<Period>("all");
  const [employee, setEmployee] = useState<string>("all");
  const [session, setSession] = useState<string>("all");
  const [product, setProduct] = useState<string>("all");

  const filtered = useMemo(() => {
    let from = 0;
    const now = Date.now();
    if (period === "today") from = startOfDay(now).getTime();
    if (period === "week") from = startOfWeek(now).getTime();
    if (period === "month") from = startOfMonth(now).getTime();
    return orders.filter((o) => {
      if (o.status !== "Paid") return false;
      if (o.createdAt < from) return false;
      if (employee !== "all" && o.employeeId !== employee) return false;
      if (session !== "all" && o.sessionId !== session) return false;
      if (product !== "all" && !o.lines.some((l) => l.productId === product)) return false;
      return true;
    });
  }, [orders, period, employee, session, product]);

  const totalOrders = filtered.length;
  const revenue = filtered.reduce((s, o) => s + o.total, 0);
  const avg = totalOrders ? revenue / totalOrders : 0;

  // sales trend by hour
  const trend = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((o) => {
      const k = format(o.createdAt, "HH:00");
      map[k] = (map[k] ?? 0) + o.total;
    });
    return Object.entries(map).sort().map(([time, rev]) => ({ time, rev }));
  }, [filtered]);

  // top categories
  const catData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((o) =>
      o.lines.forEach((l) => {
        const p = products.find((p) => p.id === l.productId);
        if (!p) return;
        map[p.categoryId] = (map[p.categoryId] ?? 0) + l.qty * l.unitPrice;
      }),
    );
    return Object.entries(map).map(([cid, rev]) => {
      const c = categories.find((c) => c.id === cid);
      return { name: c?.name ?? "?", value: rev, color: c?.color ?? "#888" };
    });
  }, [filtered, products, categories]);

  // top products
  const topProducts = useMemo(() => {
    const map: Record<string, { qty: number; rev: number }> = {};
    filtered.forEach((o) =>
      o.lines.forEach((l) => {
        if (!map[l.productId]) map[l.productId] = { qty: 0, rev: 0 };
        map[l.productId].qty += l.qty;
        map[l.productId].rev += l.qty * l.unitPrice;
      }),
    );
    return Object.entries(map)
      .map(([pid, v]) => ({ name: products.find((p) => p.id === pid)?.name ?? "?", ...v }))
      .sort((a, b) => b.rev - a.rev)
      .slice(0, 5);
  }, [filtered, products]);

  const topOrders = [...filtered].sort((a, b) => b.total - a.total).slice(0, 5);

  const exportCSV = () => {
    const rows = [["Order", "Date", "Customer", "Total"], ...filtered.map((o) => [
      o.number,
      format(o.createdAt, "yyyy-MM-dd HH:mm"),
      customers.find((c) => c.id === o.customerId)?.name ?? "",
      o.total.toFixed(2),
    ])];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${Date.now()}.csv`;
    a.click();
  };

  return (
    <AdminShell title="Reports">
      <div className="flex flex-wrap gap-2 mb-4">
        <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
        <Select value={employee} onValueChange={setEmployee}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Employee" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={session} onValueChange={setSession}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Session" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sessions</SelectItem>
            {sessions.map((s) => <SelectItem key={s.id} value={s.id}>{format(s.openedAt, "M/d HH:mm")}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={product} onValueChange={setProduct}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Product" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCSV} className="ml-auto"><Download className="w-4 h-4 mr-1" /> CSV/XLS</Button>
        <Button variant="outline" onClick={() => window.print()}><Download className="w-4 h-4 mr-1" /> PDF</Button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Orders</div>
          <div className="text-3xl font-bold">{totalOrders}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Revenue</div>
          <div className="text-3xl font-bold">₹{revenue.toFixed(2)}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Average Order</div>
          <div className="text-3xl font-bold">₹{avg.toFixed(2)}</div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Sales Trend</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={trend}>
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="rev" fill="#F59E0B" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Top Categories</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={catData} dataKey="value" nameKey="name" outerRadius={80} label>
                  {catData.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Top Orders</h3>
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="text-left p-1">Order</th><th className="text-left p-1">Date</th><th className="text-right p-1">Total</th></tr></thead>
            <tbody>
              {topOrders.map((o) => (
                <tr key={o.id} className="border-b">
                  <td className="p-1">#{o.number}</td>
                  <td className="p-1">{format(o.createdAt, "M/d HH:mm")}</td>
                  <td className="p-1 text-right">₹{o.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold mb-2">Top Products</h3>
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="text-left p-1">Product</th><th className="text-right p-1">Qty</th><th className="text-right p-1">Revenue</th></tr></thead>
            <tbody>
              {topProducts.map((p, i) => (
                <tr key={i} className="border-b">
                  <td className="p-1">{p.name}</td>
                  <td className="p-1 text-right">{p.qty}</td>
                  <td className="p-1 text-right">₹{p.rev.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </AdminShell>
  );
}
