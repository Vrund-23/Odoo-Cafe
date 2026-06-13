import { useState, useEffect } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const TAXES = [0, 5, 12, 18, 28];
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

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [selected, setSelected] = useState([]);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [catOpen, setCatOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodsRes, catsRes] = await Promise.all([
        fetch(`${BASE_URL}/products`, { headers: getAuthHeaders() }),
        fetch(`${BASE_URL}/categories`, { headers: getAuthHeaders() }),
      ]);
      
      if (!prodsRes.ok || !catsRes.ok) throw new Error("Failed to fetch data");
      
      const prodsJson = await prodsRes.json();
      const catsJson = await catsRes.json();
      
      const pData = prodsJson.data || prodsJson;
      const cData = catsJson.data || catsJson;

      setProducts(Array.isArray(pData) ? pData.map(normaliseProduct) : []);
      setCategories(Array.isArray(cData) ? cData : []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()));

  const startNew = () => {
    setEditing({
      name: "",
      categoryId: categories[0]?.id ?? "",
      price: 0,
      unit: "piece",
      tax: 5,
      description: "",
      sendToKitchen: true,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!editing?.name) return toast.error("Name required");
    try {
      const payload = {
        name: editing.name,
        categoryId: editing.categoryId,
        price: editing.price,
        unitOfMeasure: editing.unit,
        tax: editing.tax,
        description: editing.description,
        imageUrl: editing.imageUrl,
        showInKds: editing.sendToKitchen,
      };

      const isNew = !editing.id;
      const url = isNew ? `${BASE_URL}/products` : `${BASE_URL}/products/${editing.id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save product");
      const json = await res.json();
      const saved = normaliseProduct(json.data || json);

      setProducts((prev) =>
        isNew ? [...prev, saved] : prev.map((p) => (p.id === saved.id ? saved : p))
      );
      setOpen(false);
      toast.success("Product saved successfully");
    } catch (err) {
      toast.error(err.message || "Failed to save product");
    }
  };

  const deleteProduct = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/products/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete product");
      
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setSelected((prev) => prev.filter((x) => x !== id));
      toast.success("Product deleted successfully");
    } catch (err) {
      toast.error(err.message || "Failed to delete product");
    }
  };

  const createCat = async () => {
    if (!newCatName?.trim()) return;
    const colors = ["#F59E0B", "#EC4899", "#10B981", "#3B82F6", "#8B5CF6"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    try {
      const res = await fetch(`${BASE_URL}/categories`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: newCatName, color }),
      });
      if (!res.ok) throw new Error("Failed to create category");
      const json = await res.json();
      const savedCat = json.data || json;

      setCategories((prev) => [...prev, savedCat]);
      if (editing) setEditing({ ...editing, categoryId: savedCat.id });
      setNewCatName("");
      setCatOpen(false);
      toast.success("Category created successfully");
    } catch (err) {
      toast.error(err.message || "Failed to create category");
    }
  };


  return (
    <AdminShell title="Products">
      <div className="flex items-center gap-2 mb-4">
        <Button 
          onClick={startNew}
          className="bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white font-bold rounded-xl cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1" /> New Product
        </Button>
        {selected.length > 0 && (
          <Button
            variant="destructive"
            onClick={() => {
              selected.forEach(deleteProduct);
            }}
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 font-bold rounded-xl cursor-pointer"
          >
            <Trash2 className="w-4 h-4 mr-1 inline" /> Delete ({selected.length})
          </Button>
        )}
        <div className="relative ml-auto w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <Input 
            placeholder="Search products..." 
            value={q} 
            onChange={(e) => setQ(e.target.value)} 
            className="pl-9 bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/30 focus:border-[#6F4E37] focus:bg-white rounded-xl"
          />
        </div>
      </div>

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
                  <th className="p-3 w-10 text-center"></th>
                  <th className="p-3 text-left font-bold text-[#6F4E37]/80">Name</th>
                  <th className="p-3 text-left font-bold text-[#6F4E37]/80">Category</th>
                  <th className="p-3 text-right font-bold text-[#6F4E37]/80">Price</th>
                  <th className="p-3 text-right font-bold text-[#6F4E37]/80">Tax</th>
                  <th className="p-3 w-20 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const c = categories.find((cat) => cat.id === p.categoryId);
                  return (
                    <tr key={p.id} className="border-b border-[#6F4E37]/10 last:border-0 hover:bg-[#FAF3E0]/10 transition duration-150">
                      <td className="p-3 text-center">
                        <Checkbox
                          checked={selected.includes(p.id)}
                          onCheckedChange={(v) =>
                            setSelected(v ? [...selected, p.id] : selected.filter((x) => x !== p.id))
                          }
                          className="border-[#6F4E37]/30 text-[#6F4E37] data-[state=checked]:bg-[#6F4E37]"
                        />
                      </td>
                      <td className="p-3 font-semibold text-[#2B2118]">{p.name}</td>
                      <td className="p-3">
                        {c && (
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-bold text-white shadow-sm"
                            style={{ background: c.color }}
                          >
                            {c.name}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right font-extrabold text-[#6F4E37]">₹{p.price}</td>
                      <td className="p-3 text-right text-[#6F4E37]/80">{p.tax}%</td>
                      <td className="p-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => { setEditing(p); setOpen(true); }}
                            className="hover:bg-[#6F4E37]/10 text-[#6F4E37]/60 hover:text-[#6F4E37] h-8 w-8 rounded-lg cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => deleteProduct(p.id)}
                            className="hover:bg-red-500/10 text-[#6F4E37]/60 hover:text-red-400 h-8 w-8 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-[#6F4E37]/60">No products found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white border border-[#6F4E37]/30 text-[#2B2118] max-w-lg rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#6F4E37] font-extrabold text-lg">
              {editing?.id ? "Edit" : "New"} Product
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-4 py-2 text-sm text-[#6F4E37]/80">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs text-[#6F4E37]/60">Name</Label>
                <Input 
                  value={editing.name} 
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })} 
                  className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/25 rounded-xl font-semibold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#6F4E37]/60">Category</Label>
                <Select
                  value={editing.categoryId}
                  onValueChange={(v) => {
                    if (v === "__new") setCatOpen(true);
                    else setEditing({ ...editing, categoryId: v });
                  }}
                >
                  <SelectTrigger className="bg-[#FAF3E0] border-[#6F4E37]/25 text-[#2B2118] rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#6F4E37]/35 text-[#2B2118]">
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                    <SelectItem value="__new">+ Create new...</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#6F4E37]/60">Price (₹)</Label>
                <Input 
                  type="number" 
                  value={editing.price} 
                  onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })} 
                  className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/25 rounded-xl font-bold text-[#6F4E37]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#6F4E37]/60">Unit</Label>
                <Input 
                  value={editing.unit} 
                  onChange={(e) => setEditing({ ...editing, unit: e.target.value })} 
                  className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/25 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#6F4E37]/60">Tax</Label>
                <Select value={String(editing.tax)} onValueChange={(v) => setEditing({ ...editing, tax: parseInt(v) })}>
                  <SelectTrigger className="bg-[#FAF3E0] border-[#6F4E37]/25 text-[#2B2118] rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#6F4E37]/35 text-[#2B2118]">
                    {TAXES.map((t) => (
                      <SelectItem key={t} value={String(t)}>{t}%</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs text-[#6F4E37]/60">Description</Label>
                <Input 
                  value={editing.description ?? ""} 
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })} 
                  className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/25 rounded-xl"
                />
              </div>
              <div className="col-span-2 flex items-center gap-3 pt-2">
                <Checkbox
                  id="k"
                  checked={editing.sendToKitchen}
                  onCheckedChange={(v) => setEditing({ ...editing, sendToKitchen: !!v })}
                  className="border-[#6F4E37]/30 text-[#6F4E37] data-[state=checked]:bg-[#6F4E37]"
                />
                <Label htmlFor="k" className="cursor-pointer font-semibold">Send to Kitchen Display</Label>
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
              Save Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent className="bg-white border border-[#6F4E37]/30 text-[#2B2118] max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#6F4E37] font-extrabold text-lg">New Category</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label className="text-xs text-[#6F4E37]/60">Category Name</Label>
            <Input 
              value={newCatName} 
              onChange={(e) => setNewCatName(e.target.value)} 
              className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/25 rounded-xl"
            />
          </div>
          <DialogFooter className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setCatOpen(false)}
              className="border-[#6F4E37]/20 text-[#6F4E37]/60 hover:bg-[#FAF3E0] flex-1 cursor-pointer rounded-xl"
            >
              Cancel
            </Button>
            <Button 
              onClick={createCat}
              className="bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white flex-1 font-bold cursor-pointer rounded-xl"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
