import { createFileRoute, useNavigate } from "@tanstack/react-router";
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

export const Route = createFileRoute("/pos/orders")({ component: OrdersPage });

function OrdersPage() {
  const orders = useStore((s) => s.orders);
  const customers = useStore((s) => s.customers);
  const products = useStore((s) => s.products);
  const deleteOrder = useStore((s) => s.deleteOrder);
  const setDraftOrder = useStore((s) => s.setDraftOrder);
  const setCurrentTable = useStore((s) => s.setCurrentTable);
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = orders.filter((o) => {
    if (!q) return true;
    const c = customers.find((x) => x.id === o.customerId);
    const s = q.toLowerCase();
    return (
      o.number.toLowerCase().includes(s) ||
      c?.name.toLowerCase().includes(s) ||
      format(o.createdAt, "yyyy-MM-dd").includes(s)
    );
  });

  const order = orders.find((o) => o.id === selected);

  const editOrder = (id: string) => {
    const o = orders.find((x) => x.id === id);
    if (!o) return;
    setDraftOrder(id);
    if (o.tableId) setCurrentTable(o.tableId);
    navigate({ to: "/pos" });
  };

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, # or date"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      <Card>
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Order</th>
              <th className="p-2 text-left">Customer</th>
              <th className="p-2 text-right">Amount</th>
              <th className="p-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => {
              const c = customers.find((x) => x.id === o.customerId);
              return (
                <tr
                  key={o.id}
                  className="border-t hover:bg-muted/50 cursor-pointer"
                  onClick={() => setSelected(o.id)}
                >
                  <td className="p-2">{format(o.createdAt, "M/d HH:mm")}</td>
                  <td className="p-2 font-mono">#{o.number}</td>
                  <td className="p-2">{c?.name ?? "-"}</td>
                  <td className="p-2 text-right">₹{o.total.toFixed(2)}</td>
                  <td className="p-2">
                    <Badge
                      variant={
                        o.status === "Paid" ? "default" : o.status === "Draft" ? "secondary" : "destructive"
                      }
                    >
                      {o.status}
                    </Badge>
                  </td>
                </tr>
              );
            })}
            {!filtered.length && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  No orders
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Dialog open={!!order} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order #{order?.number}</DialogTitle>
          </DialogHeader>
          {order && (
            <div className="space-y-2 text-sm">
              <div>Date: {format(order.createdAt, "M/d HH:mm")}</div>
              <div>Customer: {customers.find((c) => c.id === order.customerId)?.name ?? "-"}</div>
              <div>Amount: ₹{order.total.toFixed(2)}</div>
              <div>
                Status: <Badge>{order.status}</Badge>
              </div>
              <div className="border-t pt-2">
                <div className="font-semibold mb-1">Products:</div>
                {order.lines.map((l) => {
                  const p = products.find((x) => x.id === l.productId);
                  return (
                    <div key={l.productId} className="flex justify-between">
                      <span>
                        {p?.name} × {l.qty}
                      </span>
                      <span>₹{(l.qty * l.unitPrice).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {order?.status === "Draft" && (
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={() => {
                  deleteOrder(order.id);
                  setSelected(null);
                }}
              >
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
              <Button onClick={() => editOrder(order.id)}>
                <Edit className="w-4 h-4 mr-1" /> Edit Order
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
