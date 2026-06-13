import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useStore, type Product } from "@/lib/store";
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
import { Plus, Search, Pencil, Trash2, Archive } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/products")({ component: ProductsPage });

const TAXES = [0, 5, 12, 18, 28];

function ProductsPage() {
  const products = useStore((s) => s.products);
  const categories = useStore((s) => s.categories);
  const upsertProduct = useStore((s) => s.upsertProduct);
  const deleteProduct = useStore((s) => s.deleteProduct);
  const upsertCategory = useStore((s) => s.upsertCategory);

  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [catOpen, setCatOpen] = useState(false);

  const filtered = products.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()));

  const startNew = () => {
    setEditing({
      id: Math.random().toString(36).slice(2),
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

  const save = () => {
    if (!editing?.name) return toast.error("Name required");
    upsertProduct(editing);
    setOpen(false);
    toast.success("Saved");
  };

  const createCat = () => {
    if (!newCatName) return;
    const id = "c-" + Math.random().toString(36).slice(2, 6);
    const colors = ["#F59E0B", "#EC4899", "#10B981", "#3B82F6", "#8B5CF6"];
    upsertCategory({ id, name: newCatName, color: colors[Math.floor(Math.random() * colors.length)] });
    if (editing) setEditing({ ...editing, categoryId: id });
    setNewCatName("");
    setCatOpen(false);
  };

  return (
    <AdminShell title="Products">
      <div className="flex items-center gap-2 mb-3">
        <Button onClick={startNew}>
          <Plus className="w-4 h-4 mr-1" /> New
        </Button>
        {selected.length > 0 && (
          <>
            <Button
              variant="destructive"
              onClick={() => {
                selected.forEach(deleteProduct);
                setSelected([]);
              }}
            >
              <Trash2 className="w-4 h-4 mr-1" /> Delete ({selected.length})
            </Button>
          </>
        )}
        <div className="relative ml-auto w-64">
          <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
        </div>
      </div>
      <Card>
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 w-8"></th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Category</th>
              <th className="p-2 text-right">Price</th>
              <th className="p-2 text-right">Tax</th>
              <th className="p-2 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const c = categories.find((c) => c.id === p.categoryId);
              return (
                <tr key={p.id} className="border-t hover:bg-muted/50">
                  <td className="p-2 text-center">
                    <Checkbox
                      checked={selected.includes(p.id)}
                      onCheckedChange={(v) =>
                        setSelected(v ? [...selected, p.id] : selected.filter((x) => x !== p.id))
                      }
                    />
                  </td>
                  <td className="p-2">{p.name}</td>
                  <td className="p-2">
                    {c && (
                      <span
                        className="px-2 py-0.5 rounded text-xs text-white"
                        style={{ background: c.color }}
                      >
                        {c.name}
                      </span>
                    )}
                  </td>
                  <td className="p-2 text-right">₹{p.price}</td>
                  <td className="p-2 text-right">{p.tax}%</td>
                  <td className="p-2 flex gap-1 justify-end">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(p); setOpen(true); }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => deleteProduct(p.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{products.find((p) => p.id === editing?.id) ? "Edit" : "New"} Product</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label>Name</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={editing.categoryId}
                  onValueChange={(v) => {
                    if (v === "__new") setCatOpen(true);
                    else setEditing({ ...editing, categoryId: v });
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                    <SelectItem value="__new">+ Create new...</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Price (₹)</Label>
                <Input type="number" value={editing.price} onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Unit</Label>
                <Input value={editing.unit} onChange={(e) => setEditing({ ...editing, unit: e.target.value })} />
              </div>
              <div>
                <Label>Tax</Label>
                <Select value={String(editing.tax)} onValueChange={(v) => setEditing({ ...editing, tax: parseInt(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TAXES.map((t) => (
                      <SelectItem key={t} value={String(t)}>{t}%</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Description</Label>
                <Input value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <Checkbox
                  id="k"
                  checked={editing.sendToKitchen}
                  onCheckedChange={(v) => setEditing({ ...editing, sendToKitchen: !!v })}
                />
                <Label htmlFor="k">Send to Kitchen Display</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Discard</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Category</DialogTitle></DialogHeader>
          <Label>Name</Label>
          <Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
          <DialogFooter>
            <Button onClick={createCat}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
