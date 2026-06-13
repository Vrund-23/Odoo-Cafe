import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useStore, type Coupon } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/coupons")({ component: CouponsPage });

function CouponsPage() {
  const coupons = useStore((s) => s.coupons);
  const products = useStore((s) => s.products);
  const upsert = useStore((s) => s.upsertCoupon);
  const del = useStore((s) => s.deleteCoupon);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [open, setOpen] = useState(false);

  const startNew = () => {
    setEditing({
      id: "co-" + Math.random().toString(36).slice(2, 6),
      name: "",
      type: "Coupon",
      code: "",
      discountKind: "percent",
      discountValue: 10,
      active: true,
    });
    setOpen(true);
  };

  const save = () => {
    if (!editing?.name) return toast.error("Name required");
    upsert(editing);
    setOpen(false);
    toast.success("Saved");
  };

  return (
    <AdminShell title="Coupon & Promotion">
      <Button onClick={startNew} className="mb-3">
        <Plus className="w-4 h-4 mr-1" /> New
      </Button>
      <Card>
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">Discount</th>
              <th className="p-2 text-left">Code/Rule</th>
              <th className="p-2 text-left">Active</th>
              <th className="p-2 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-2">{c.name}</td>
                <td className="p-2">{c.type}</td>
                <td className="p-2">
                  {c.discountValue}
                  {c.discountKind === "percent" ? "%" : "₹"}
                </td>
                <td className="p-2 text-xs">
                  {c.type === "Coupon" && <code>{c.code}</code>}
                  {c.type === "Promotion" && c.apply === "Product" && `Product min qty ${c.minQty}`}
                  {c.type === "Promotion" && c.apply === "Order" && `Order ≥ ₹${c.minOrderAmount}`}
                </td>
                <td className="p-2">
                  <Switch checked={c.active} onCheckedChange={(v) => upsert({ ...c, active: v })} />
                </td>
                <td className="p-2 flex gap-1 justify-end">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => del(c.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{coupons.find((c) => c.id === editing?.id) ? "Edit" : "New"} Coupon/Promotion</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={editing.type} onValueChange={(v: any) => setEditing({ ...editing, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Coupon">Coupon</SelectItem>
                    <SelectItem value="Promotion">Promotion (Automated)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editing.type === "Coupon" && (
                <div>
                  <Label>Coupon Code</Label>
                  <Input value={editing.code ?? ""} onChange={(e) => setEditing({ ...editing, code: e.target.value })} />
                </div>
              )}
              {editing.type === "Promotion" && (
                <>
                  <div>
                    <Label>Apply</Label>
                    <Select value={editing.apply ?? "Order"} onValueChange={(v: any) => setEditing({ ...editing, apply: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Product">Product</SelectItem>
                        <SelectItem value="Order">Order</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {editing.apply === "Product" ? (
                    <>
                      <div>
                        <Label>Product</Label>
                        <Select value={editing.productId ?? ""} onValueChange={(v) => setEditing({ ...editing, productId: v })}>
                          <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                          <SelectContent>
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Min Quantity</Label>
                        <Input type="number" value={editing.minQty ?? 1} onChange={(e) => setEditing({ ...editing, minQty: parseInt(e.target.value) || 1 })} />
                      </div>
                    </>
                  ) : (
                    <div>
                      <Label>Minimum Order Amount (₹)</Label>
                      <Input type="number" value={editing.minOrderAmount ?? 0} onChange={(e) => setEditing({ ...editing, minOrderAmount: parseFloat(e.target.value) || 0 })} />
                    </div>
                  )}
                </>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Discount Value</Label>
                  <Input type="number" value={editing.discountValue} onChange={(e) => setEditing({ ...editing, discountValue: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Kind</Label>
                  <Select value={editing.discountKind} onValueChange={(v: any) => setEditing({ ...editing, discountKind: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percent">% Percentage</SelectItem>
                      <SelectItem value="amount">₹ Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editing.active} onCheckedChange={(v) => setEditing({ ...editing, active: v })} />
                <Label>Active</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Discard</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
