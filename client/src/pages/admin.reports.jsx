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
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function ReportsPage() {
  const orders = useStore((s) => s.orders);
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const users = useStore((s) => s.users);
  const customers = useStore((s) => s.customers);
  const sessions = useStore((s) => s.sessions);

  const [period, setPeriod] = useState("all");
  const [employee, setEmployee] = useState("all");
  const [session, setSession] = useState("all");
  const [product, setProduct] = useState("all");

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
    const map = {};
    filtered.forEach((o) => {
      const k = format(new Date(o.createdAt), "HH:00");
      map[k] = (map[k] ?? 0) + o.total;
    });
    return Object.entries(map).sort().map(([time, rev]) => ({ time, rev }));
  }, [filtered]);

  // top categories
  const catData = useMemo(() => {
    const map = {};
    filtered.forEach((o) =>
      o.lines.forEach((l) => {
        const p = products.find((prod) => prod.id === l.productId);
        if (!p) return;
        map[p.categoryId] = (map[p.categoryId] ?? 0) + l.qty * l.unitPrice;
      }),
    );
    return Object.entries(map).map(([cid, rev]) => {
      const c = categories.find((cat) => cat.id === cid);
      return { name: c?.name ?? "?", value: rev, color: c?.color ?? "#888" };
    });
  }, [filtered, products, categories]);

  // top products
  const topProducts = useMemo(() => {
    const map = {};
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

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Summary
    const summaryData = [
      ["Sales Report Summary"],
      [],
      ["Period", period.toUpperCase()],
      ["Total Orders", totalOrders],
      ["Total Revenue", `₹${revenue.toFixed(2)}`],
      ["Average Order", `₹${avg.toFixed(2)}`]
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    // Sheet 2: Orders
    const orderRows = [["Order Number", "Date", "Customer", "Amount"]];
    filtered.forEach((o) => {
      const c = customers.find((x) => x.id === o.customerId);
      orderRows.push([
        o.number || o.id.slice(0, 6),
        format(new Date(o.createdAt), "yyyy-MM-dd HH:mm"),
        c?.name ?? "Guest",
        o.total
      ]);
    });
    const wsOrders = XLSX.utils.aoa_to_sheet(orderRows);
    XLSX.utils.book_append_sheet(wb, wsOrders, "Orders");

    // Sheet 3: Products
    const prodRows = [["Product", "Quantity Sold", "Revenue"]];
    topProducts.forEach((p) => {
      prodRows.push([p.name, p.qty, p.rev]);
    });
    const wsProducts = XLSX.utils.aoa_to_sheet(prodRows);
    XLSX.utils.book_append_sheet(wb, wsProducts, "Top Products");

    XLSX.writeFile(wb, `OdooCafe_Report_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(111, 78, 55); // #6F4E37
    doc.text("Odoo Cafe - Sales Report", 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${format(new Date(), "PPP p")}`, 14, 30);
    doc.text(`Period: ${period.toUpperCase()}`, 14, 36);
    
    // Summary Box
    doc.autoTable({
      startY: 45,
      head: [['Total Orders', 'Total Revenue', 'Average Order']],
      body: [[
        totalOrders.toString(),
        `Rs. ${revenue.toFixed(2)}`,
        `Rs. ${avg.toFixed(2)}`
      ]],
      theme: 'grid',
      headStyles: { fillColor: [111, 78, 55], textColor: 255 },
      styles: { halign: 'center', fontSize: 12, fontStyle: 'bold' }
    });

    // Orders Table
    doc.setFontSize(14);
    doc.setTextColor(111, 78, 55);
    doc.text("Order Details", 14, doc.lastAutoTable.finalY + 15);
    
    const orderBody = filtered.map((o) => [
      o.number || o.id.slice(0, 6),
      format(new Date(o.createdAt), "yyyy-MM-dd HH:mm"),
      customers.find((c) => c.id === o.customerId)?.name ?? "Guest",
      `Rs. ${o.total.toFixed(2)}`
    ]);

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Order #', 'Date', 'Customer', 'Amount']],
      body: orderBody,
      headStyles: { fillColor: [111, 78, 55] },
      alternateRowStyles: { fillColor: [250, 243, 224] },
    });

    // Products Table
    doc.text("Top Products", 14, doc.lastAutoTable.finalY + 15);
    const prodBody = topProducts.map((p) => [
      p.name,
      p.qty.toString(),
      `Rs. ${p.rev.toFixed(2)}`
    ]);

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Product', 'Quantity Sold', 'Revenue']],
      body: prodBody,
      headStyles: { fillColor: [111, 78, 55] },
      alternateRowStyles: { fillColor: [250, 243, 224] },
    });

    doc.save(`OdooCafe_Report_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);
  };

  return (
    <AdminShell title="Reports">
      <div className="flex flex-wrap gap-2.5 mb-6">
        <Select value={period} onValueChange={(v) => setPeriod(v)}>
          <SelectTrigger className="w-36 bg-[#FAF3E0] border-[#6F4E37]/25 text-[#2B2118] rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-[#6F4E37]/35 text-[#2B2118]">
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>

        <Select value={employee} onValueChange={setEmployee}>
          <SelectTrigger className="w-44 bg-[#FAF3E0] border-[#6F4E37]/25 text-[#2B2118] rounded-xl">
            <SelectValue placeholder="Employee" />
          </SelectTrigger>
          <SelectContent className="bg-white border-[#6F4E37]/35 text-[#2B2118]">
            <SelectItem value="all">All Employees</SelectItem>
            {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={session} onValueChange={setSession}>
          <SelectTrigger className="w-44 bg-[#FAF3E0] border-[#6F4E37]/25 text-[#2B2118] rounded-xl">
            <SelectValue placeholder="Session" />
          </SelectTrigger>
          <SelectContent className="bg-white border-[#6F4E37]/35 text-[#2B2118]">
            <SelectItem value="all">All Sessions</SelectItem>
            {sessions.map((s) => <SelectItem key={s.id} value={s.id}>{format(new Date(s.openedAt), "M/d HH:mm")}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={product} onValueChange={setProduct}>
          <SelectTrigger className="w-44 bg-[#FAF3E0] border-[#6F4E37]/25 text-[#2B2118] rounded-xl">
            <SelectValue placeholder="Product" />
          </SelectTrigger>
          <SelectContent className="bg-white border-[#6F4E37]/35 text-[#2B2118]">
            <SelectItem value="all">All Products</SelectItem>
            {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="ml-auto flex gap-2">
          <Button 
            variant="outline" 
            onClick={exportExcel}
            className="border-[#6F4E37]/25 text-[#6F4E37]/80 hover:bg-[#FAF3E0] rounded-xl cursor-pointer"
          >
            <Download className="w-4 h-4 mr-1.5 inline" /> Excel (XLSX)
          </Button>
          <Button 
            variant="outline" 
            onClick={exportPDF}
            className="border-[#6F4E37]/25 text-[#6F4E37]/80 hover:bg-[#FAF3E0] rounded-xl cursor-pointer"
          >
            <Download className="w-4 h-4 mr-1.5 inline" /> PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 bg-white border border-[#6F4E37]/25 rounded-3xl text-[#2B2118] shadow-md">
          <div className="text-xs font-bold uppercase text-[#6F4E37]/60">Total Orders</div>
          <div className="text-3xl font-extrabold text-[#6F4E37] mt-1.5">{totalOrders}</div>
        </Card>
        <Card className="p-5 bg-white border border-[#6F4E37]/25 rounded-3xl text-[#2B2118] shadow-md">
          <div className="text-xs font-bold uppercase text-[#6F4E37]/60">Revenue</div>
          <div className="text-3xl font-extrabold text-[#6F4E37] mt-1.5">₹{revenue.toFixed(2)}</div>
        </Card>
        <Card className="p-5 bg-white border border-[#6F4E37]/25 rounded-3xl text-[#2B2118] shadow-md">
          <div className="text-xs font-bold uppercase text-[#6F4E37]/60">Average Order</div>
          <div className="text-3xl font-extrabold text-[#6F4E37] mt-1.5">₹{avg.toFixed(2)}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card className="p-5 bg-white border border-[#6F4E37]/25 rounded-3xl text-[#2B2118] shadow-md">
          <h3 className="font-extrabold text-sm uppercase text-[#6F4E37]/80 mb-4 tracking-wider">Sales Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend}>
                <XAxis dataKey="time" stroke="#71717a" fontSize={12} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#6F4E37", borderRadius: "12px", color: "#2B2118" }}
                  itemStyle={{ color: "#6F4E37" }}
                />
                <Bar dataKey="rev" fill="#6F4E37" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 bg-white border border-[#6F4E37]/25 rounded-3xl text-[#2B2118] shadow-md">
          <h3 className="font-extrabold text-sm uppercase text-[#6F4E37]/80 mb-4 tracking-wider">Top Categories</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={catData} dataKey="value" nameKey="name" outerRadius={75} labelLine={false} label={({ name }) => name}>
                  {catData.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#6F4E37", borderRadius: "12px", color: "#2B2118" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5 bg-white border border-[#6F4E37]/25 rounded-3xl text-[#2B2118] shadow-md">
          <h3 className="font-extrabold text-sm uppercase text-[#6F4E37]/80 mb-4 tracking-wider">Top Orders</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[#6F4E37]/20 bg-[#FAF3E0]/50">
                <tr>
                  <th className="text-left p-2.5 font-bold text-[#6F4E37]/80">Order</th>
                  <th className="text-left p-2.5 font-bold text-[#6F4E37]/80">Date</th>
                  <th className="text-right p-2.5 font-bold text-[#6F4E37]/80">Total</th>
                </tr>
              </thead>
              <tbody>
                {topOrders.map((o) => (
                  <tr key={o.id} className="border-b border-[#6F4E37]/10 last:border-0 hover:bg-[#FAF3E0]/10 transition duration-150">
                    <td className="p-2.5 font-mono font-bold text-[#6F4E37]">#{o.number}</td>
                    <td className="p-2.5 text-[#6F4E37]/80">{format(new Date(o.createdAt), "M/d HH:mm")}</td>
                    <td className="p-2.5 text-right font-extrabold text-[#2B2118]">₹{o.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-5 bg-white border border-[#6F4E37]/25 rounded-3xl text-[#2B2118] shadow-md">
          <h3 className="font-extrabold text-sm uppercase text-[#6F4E37]/80 mb-4 tracking-wider">Top Products</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[#6F4E37]/20 bg-[#FAF3E0]/50">
                <tr>
                  <th className="text-left p-2.5 font-bold text-[#6F4E37]/80">Product</th>
                  <th className="text-right p-2.5 font-bold text-[#6F4E37]/80">Qty</th>
                  <th className="text-right p-2.5 font-bold text-[#6F4E37]/80">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={i} className="border-b border-[#6F4E37]/10 last:border-0 hover:bg-[#FAF3E0]/10 transition duration-150">
                    <td className="p-2.5 font-semibold text-[#2B2118]">{p.name}</td>
                    <td className="p-2.5 text-right text-[#6F4E37]/80 font-bold">{p.qty}</td>
                    <td className="p-2.5 text-right font-extrabold text-[#6F4E37]">₹{p.rev.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminShell>
  );
}
