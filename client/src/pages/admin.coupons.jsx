import { useState, useEffect } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getAuthHeaders() {
  const headers = { "Content-Type": "application/json" };
  try {
    const raw = localStorage.getItem("cafe-auth-token");
    const token = raw ? raw.replace(/^"|"$/g, "") : null;
    if (token) headers["Authorization"] = `Bearer ${token}`;
  } catch (e) {}
  return headers;
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

export default function CouponsPage() {
  const [coupons, setCoupons] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [couponsRes, prodsRes] = await Promise.all([
        fetch(`${BASE_URL}/coupons`, { headers: getAuthHeaders() }),
        fetch(`${BASE_URL}/products`, { headers: getAuthHeaders() }),
      ]);
      
      if (!couponsRes.ok || !prodsRes.ok) throw new Error("Failed to fetch data");
      
      const couponsJson = await couponsRes.json();
      const prodsJson = await prodsRes.json();
      
      const cData = couponsJson.data || couponsJson;
      const pData = prodsJson.data || prodsJson;

      const couponsArray = cData.coupons ?? cData;
      
      setCoupons(Array.isArray(couponsArray) ? couponsArray.map(normaliseCoupon) : []);
      setProducts(Array.isArray(pData) ? pData : []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startNew = () => {
    setEditing({
      name: "",
      type: "Coupon",
      code: "",
      discountKind: "percent",
      discountValue: 10,
      active: true,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!editing?.name) return toast.error("Name required");
    try {
      const discountType = editing.discountKind === "percent" ? "PERCENTAGE" : "FIXED";
      const isPromotion = editing.type === "Promotion";
      const payload = {
        name: editing.name,
        code: editing.code || undefined,
        discountType,
        discountValue: editing.discountValue,
        isActive: editing.active,
        ...(isPromotion && {
          promotionType: editing.apply === "Product" ? "PRODUCT" : "ORDER",
          productId: editing.productId || null,
          minQuantity: editing.minQty ?? null,
          minOrderAmount: editing.minOrderAmount ?? null,
        }),
      };

      const isNew = !editing.id;
      const url = isNew ? `${BASE_URL}/coupons` : `${BASE_URL}/coupons/${editing.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save coupon/promotion");
      const json = await res.json();
      const saved = normaliseCoupon(json.data || json);

      setCoupons((prev) =>
        isNew ? [...prev, saved] : prev.map((c) => (c.id === saved.id ? saved : c))
      );
      setOpen(false);
      toast.success("Saved successfully");
    } catch (err) {
      toast.error(err.message || "Failed to save coupon/promotion");
    }
  };

  const handleToggleActive = async (c, active) => {
    try {
      const discountType = c.discountKind === "percent" ? "PERCENTAGE" : "FIXED";
      const isPromotion = c.type === "Promotion";
      const payload = {
        name: c.name,
        code: c.code || undefined,
        discountType,
        discountValue: c.discountValue,
        isActive: active, // updating active state
        ...(isPromotion && {
          promotionType: c.apply === "Product" ? "PRODUCT" : "ORDER",
          productId: c.productId || null,
          minQuantity: c.minQty ?? null,
          minOrderAmount: c.minOrderAmount ?? null,
        }),
      };

      const res = await fetch(`${BASE_URL}/coupons/${c.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update status");
      const json = await res.json();
      const saved = normaliseCoupon(json.data || json);

      setCoupons((prev) => prev.map((item) => (item.id === saved.id ? saved : item)));
      toast.success("Coupon status updated");
    } catch (err) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/coupons/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete");
      
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      toast.success("Deleted successfully");
    } catch (err) {
      toast.error(err.message || "Failed to delete");
    }
  };

  return (
    <AdminShell title="Coupon & Promotion">
      <Button 
        onClick={startNew} 
        className="mb-4 bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white font-bold rounded-xl cursor-pointer"
      >
        <Plus className="w-4 h-4 mr-1" /> New Coupon
      </Button>
      <Card className="bg-white border border-[#6F4E37]/25 rounded-3xl overflow-hidden shadow-md text-[#2B2118]">
        {loading ? (
          <div className="flex justify-center p-8 text-[#6F4E37]/60">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#FAF3E0] border-b border-[#6F4E37]/20">
                <tr>
                  <th className="p-3 text-left font-bold text-[#6F4E37]/80">Name</th>
                  <th className="p-3 text-left font-bold text-[#6F4E37]/80">Type</th>
                  <th className="p-3 text-left font-bold text-[#6F4E37]/80">Discount</th>
                  <th className="p-3 text-left font-bold text-[#6F4E37]/80">Code/Rule</th>
                  <th className="p-3 text-left font-bold text-[#6F4E37]/80">Active</th>
                  <th className="p-3 w-24 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} className="border-b border-[#6F4E37]/10 last:border-0 hover:bg-[#FAF3E0]/10 transition duration-150">
                    <td className="p-3 font-semibold text-[#2B2118]">{c.name}</td>
                    <td className="p-3 text-[#6F4E37]/80">{c.type}</td>
                    <td className="p-3 font-bold text-[#6F4E37]">
                      {c.discountValue}
                      {c.discountKind === "percent" ? "%" : "₹"}
                    </td>
                    <td className="p-3 text-xs font-mono text-[#6F4E37]/60">
                      {c.type === "Coupon" && <span className="bg-[#FAF3E0] px-2 py-1 rounded border border-[#6F4E37]/20 text-[#6F4E37]">{c.code}</span>}
                      {c.type === "Promotion" && c.apply === "Product" && `Product min qty ${c.minQty}`}
                      {c.type === "Promotion" && c.apply === "Order" && `Order ≥ ₹${c.minOrderAmount}`}
                    </td>
                    <td className="p-3">
                      <Switch 
                        checked={c.active} 
                        onCheckedChange={(v) => handleToggleActive(c, v)} 
                        className="data-[state=checked]:bg-[#6F4E37]"
                      />
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => { setEditing(c); setOpen(true); }}
                          className="hover:bg-[#6F4E37]/10 text-[#6F4E37]/60 hover:text-[#6F4E37] h-8 w-8 rounded-lg cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => handleDelete(c.id)}
                          className="hover:bg-red-500/10 text-[#6F4E37]/60 hover:text-red-400 h-8 w-8 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {coupons.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-[#6F4E37]/60">No coupons found.</td>
                  </tr>
                )}
              </tbody>
            </table>

          </div>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white border border-[#6F4E37]/30 text-[#2B2118] max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#6F4E37] font-extrabold text-lg">
              {editing?.id ? "Edit" : "New"} Coupon/Promotion
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-2 text-sm text-[#6F4E37]/80">
              <div className="space-y-1">
                <Label className="text-xs text-[#6F4E37]/60">Name</Label>
                <Input 
                  value={editing.name} 
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })} 
                  className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/25 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#6F4E37]/60">Type</Label>
                <Select value={editing.type} onValueChange={(v) => setEditing({ ...editing, type: v })}>
                  <SelectTrigger className="bg-[#FAF3E0] border-[#6F4E37]/25 rounded-xl text-[#2B2118]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#6F4E37]/35 text-[#2B2118]">
                    <SelectItem value="Coupon">Coupon</SelectItem>
                    <SelectItem value="Promotion">Promotion (Automated)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editing.type === "Coupon" && (
                <div className="space-y-1">
                  <Label className="text-xs text-[#6F4E37]/60">Coupon Code</Label>
                  <Input 
                    value={editing.code ?? ""} 
                    onChange={(e) => setEditing({ ...editing, code: e.target.value })} 
                    className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/25 rounded-xl font-mono uppercase"
                  />
                </div>
              )}
              {editing.type === "Promotion" && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs text-[#6F4E37]/60">Apply</Label>
                    <Select value={editing.apply ?? "Order"} onValueChange={(v) => setEditing({ ...editing, apply: v })}>
                      <SelectTrigger className="bg-[#FAF3E0] border-[#6F4E37]/25 rounded-xl text-[#2B2118]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#6F4E37]/35 text-[#2B2118]">
                        <SelectItem value="Product">Product</SelectItem>
                        <SelectItem value="Order">Order</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {editing.apply === "Product" ? (
                    <>
                      <div className="space-y-1">
                        <Label className="text-xs text-[#6F4E37]/60">Product</Label>
                        <Select value={editing.productId ?? ""} onValueChange={(v) => setEditing({ ...editing, productId: v })}>
                          <SelectTrigger className="bg-[#FAF3E0] border-[#6F4E37]/25 rounded-xl text-[#2B2118]">
                            <SelectValue placeholder="Select product" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-[#6F4E37]/35 text-[#2B2118]">
                            {products.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-[#6F4E37]/60">Min Quantity</Label>
                        <Input 
                          type="number" 
                          value={editing.minQty ?? 1} 
                          onChange={(e) => setEditing({ ...editing, minQty: parseInt(e.target.value) || 1 })} 
                          className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/25 rounded-xl"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1">
                      <Label className="text-xs text-[#6F4E37]/60">Minimum Order Amount (₹)</Label>
                      <Input 
                        type="number" 
                        value={editing.minOrderAmount ?? 0} 
                        onChange={(e) => setEditing({ ...editing, minOrderAmount: parseFloat(e.target.value) || 0 })} 
                        className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/25 rounded-xl"
                      />
                    </div>
                  )}
                </>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-[#6F4E37]/60">Discount Value</Label>
                  <Input 
                    type="number" 
                    value={editing.discountValue} 
                    onChange={(e) => setEditing({ ...editing, discountValue: parseFloat(e.target.value) || 0 })} 
                    className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/25 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-[#6F4E37]/60">Kind</Label>
                  <Select value={editing.discountKind} onValueChange={(v) => setEditing({ ...editing, discountKind: v })}>
                    <SelectTrigger className="bg-[#FAF3E0] border-[#6F4E37]/25 rounded-xl text-[#2B2118]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#6F4E37]/35 text-[#2B2118]">
                      <SelectItem value="percent">% Percentage</SelectItem>
                      <SelectItem value="amount">₹ Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Switch 
                  checked={editing.active} 
                  onCheckedChange={(v) => setEditing({ ...editing, active: v })} 
                  className="data-[state=checked]:bg-[#6F4E37]"
                />
                <Label className="cursor-pointer font-semibold">Active</Label>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="border-[#6F4E37]/20 text-[#6F4E37]/60 hover:bg-[#FAF3E0] flex-1 cursor-pointer rounded-xl"
            >
              Discard
            </Button>
            <Button 
              onClick={save}
              className="bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white flex-1 font-bold cursor-pointer rounded-xl"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
