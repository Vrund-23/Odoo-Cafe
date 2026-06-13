import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Search, Trash2, Edit } from "lucide-react";

export default function OrdersPage() {
  const orders = useStore((s) => s.orders);
  const customers = useStore((s) => s.customers);
  const products = useStore((s) => s.products);
  const deleteOrder = useStore((s) => s.deleteOrder);
  const setDraftOrder = useStore((s) => s.setDraftOrder);
  const setCurrentTable = useStore((s) => s.setCurrentTable);
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = orders.filter((o) => {
    if (!q) return true;
    const c = customers.find((x) => x.id === o.customerId);
    const s = q.toLowerCase();
    return (
      o.number.toLowerCase().includes(s) ||
      c?.name.toLowerCase().includes(s) ||
      format(new Date(o.createdAt), "yyyy-MM-dd").includes(s)
    );
  });

  const order = orders.find((o) => o.id === selected);

  const editOrder = (id) => {
    const o = orders.find((x) => x.id === id);
    if (!o) return;
    setDraftOrder(id);
    if (o.tableId) setCurrentTable(o.tableId);
    navigate("/pos");
  };

  return (
    <div className="p-6 bg-[#FAF3E0] text-[#2B2118] min-h-[calc(100vh-4rem)] max-w-6xl mx-auto space-y-4 select-none">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-extrabold text-[#6F4E37] tracking-tight">Orders</h1>
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input
            placeholder="Search by name, # or date..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/30 focus:border-[#6F4E37] focus:bg-white rounded-xl"
          />
        </div>
      </div>

      <Card className="bg-white border border-[#6F4E37]/25 rounded-3xl overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FAF3E0] border-b border-[#6F4E37]/20">
              <tr>
                <th className="p-3 text-left font-bold text-[#6F4E37]/80">Date</th>
                <th className="p-3 text-left font-bold text-[#6F4E37]/80">Order</th>
                <th className="p-3 text-left font-bold text-[#6F4E37]/80">Table</th>
                <th className="p-3 text-left font-bold text-[#6F4E37]/80">Customer</th>
                <th className="p-3 text-right font-bold text-[#6F4E37]/80">Amount</th>
                <th className="p-3 text-left font-bold text-[#6F4E37]/80">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const c = customers.find((x) => x.id === o.customerId);
                const t = useStore.getState().tables.find((x) => x.id === o.tableId);
                return (
                  <tr
                    key={o.id}
                    className="border-b border-[#6F4E37]/10 last:border-0 hover:bg-[#FAF3E0]/20 transition-all duration-200 cursor-pointer"
                    onClick={() => setSelected(o.id)}
                  >
                    <td className="p-3 text-[#6F4E37]/80">{format(new Date(o.createdAt), "M/d HH:mm")}</td>
                    <td className="p-3 font-mono font-bold text-[#6F4E37]">#{o.number || o.id.slice(0,6)}</td>
                    <td className="p-3 font-bold text-[#6F4E37]">{t ? `T-${t.number}` : "-"}</td>
                    <td className="p-3 text-[#2B2118] font-[#2B2118] font-semibold">{c?.name ?? "-"}</td>
                    <td className="p-3 text-right font-extrabold text-[#6F4E37]">₹{o.total.toFixed(2)}</td>
                    <td className="p-3">
                      <Badge
                        className={`rounded-full px-2 py-0.5 text-xs font-bold border ${
                          o.status === "Paid"
                            ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-400"
                            : o.status === "Draft"
                              ? "bg-[#6F4E37]/10 border-[#6F4E37]/30 text-[#6F4E37]"
                              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                        }`}
                      >
                        {o.status}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
              {!filtered.length && (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-zinc-500 font-semibold">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={!!order} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="bg-white border border-[#6F4E37]/30 text-[#2B2118] max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#6F4E37] font-extrabold text-lg">Order #{order?.number}</DialogTitle>
          </DialogHeader>
          {order && (
            <div className="space-y-4 py-2 text-sm text-[#6F4E37]/80">
              <div className="flex justify-between border-b border-[#6F4E37]/10 pb-2">
                <span>Date:</span>
                <span className="font-bold text-[#2B2118]">{format(new Date(order.createdAt), "M/d HH:mm")}</span>
              </div>
              <div className="flex justify-between border-b border-[#6F4E37]/10 pb-2">
                <span>Customer:</span>
                <span className="font-bold text-[#2B2118]">
                  {customers.find((c) => c.id === order.customerId)?.name ?? "-"}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#6F4E37]/10 pb-2">
                <span>Amount:</span>
                <span className="font-extrabold text-[#6F4E37]">₹{order.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b border-[#6F4E37]/10 pb-2">
                <span>Status:</span>
                <Badge
                  className={`rounded-full px-2 py-0.5 text-xs font-bold border ${
                    order.status === "Paid"
                      ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-400"
                      : order.status === "Draft"
                        ? "bg-[#6F4E37]/10 border-[#6F4E37]/30 text-[#6F4E37]"
                        : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                  }`}
                >
                  {order.status}
                </Badge>
              </div>
              <div className="pt-2">
                <div className="font-bold text-[#6F4E37] mb-2">Products:</div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {order.lines.map((l) => {
                    const p = products.find((x) => x.id === l.productId);
                    return (
                      <div key={l.productId} className="flex justify-between bg-[#FAF3E0]/40 p-2 rounded-xl border border-[#6F4E37]/10">
                        <span className="text-[#2B2118]">
                          {p?.name} <span className="text-xs text-[#6F4E37] font-bold">× {l.qty}</span>
                        </span>
                        <span className="font-bold text-[#2B2118]">₹{(l.qty * l.unitPrice).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          {order?.status === "Draft" && (
            <DialogFooter className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => {
                  deleteOrder(order.id);
                  setSelected(null);
                }}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 flex-1 font-bold cursor-pointer rounded-xl py-2"
              >
                <Trash2 className="w-4 h-4 mr-1 inline" /> Delete
              </Button>
              <Button 
                onClick={() => editOrder(order.id)}
                className="bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white flex-1 font-bold cursor-pointer rounded-xl py-2"
              >
                <Edit className="w-4 h-4 mr-1 inline" /> Edit Order
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
