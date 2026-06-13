import { useState, useEffect } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#F59E0B", "#EC4899", "#10B981", "#3B82F6", "#8B5CF6", "#EF4444", "#06B6D4"];
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

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${BASE_URL}/categories`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch categories");
      const json = await res.json();
      setCategories(json.data || json);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startNew = () => {
    setEditing({
      name: "",
      color: COLORS[categories.length % COLORS.length],
    });
    setOpen(true);
  };

  const save = async () => {
    if (!editing?.name?.trim()) return toast.error("Name required");
    try {
      const isNew = !editing.id;
      const method = isNew ? "POST" : "PUT";
      const url = isNew ? `${BASE_URL}/categories` : `${BASE_URL}/categories/${editing.id}`;
      
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(editing),
      });

      if (!res.ok) throw new Error("Failed to save category");
      const json = await res.json();
      const saved = json.data || json;

      setCategories((prev) => 
        isNew ? [...prev, saved] : prev.map((c) => (c.id === saved.id ? saved : c))
      );
      
      setOpen(false);
      toast.success("Category saved successfully");
    } catch (err) {
      toast.error(err.message || "Failed to save category");
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/categories/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete category");
      
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Category deleted successfully");
    } catch (err) {
      toast.error(err.message || "Failed to delete category");
    }
  };

  return (
    <AdminShell title="Category">
      <Button 
        onClick={startNew} 
        className="mb-4 bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white font-bold rounded-xl cursor-pointer"
      >
        <Plus className="w-4 h-4 mr-1" /> New Category
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
                  <th className="p-3 text-left font-bold text-[#6F4E37]/80">Color Badge</th>
                  <th className="p-3 w-24 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="border-b border-[#6F4E37]/10 last:border-0 hover:bg-[#FAF3E0]/10 transition duration-150">
                    <td className="p-3 font-semibold text-[#2B2118] flex items-center gap-3">
                      <span 
                        className="w-3.5 h-3.5 rounded-full inline-block shadow-sm" 
                        style={{ background: c.color }} 
                      />
                      {c.name}
                    </td>
                    <td className="p-3">
                      <span 
                        className="px-2 py-0.5 rounded-full text-xs font-bold text-white shadow-sm"
                        style={{ background: c.color }}
                      >
                        {c.color}
                      </span>
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
                {categories.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-4 text-center text-[#6F4E37]/60">No categories found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white border border-[#6F4E37]/30 text-[#2B2118] max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#6F4E37] font-extrabold text-lg">
              {editing?.id ? "Edit" : "New"} Category
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-2 text-sm text-[#6F4E37]/80">
              <div className="space-y-1">
                <Label className="text-xs text-[#6F4E37]/60">Category Name</Label>
                <Input 
                  value={editing.name} 
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })} 
                  className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/25 rounded-xl font-semibold"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-[#6F4E37]/60 block">Theme Color</Label>
                <div className="flex flex-wrap gap-2.5">
                  {COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setEditing({ ...editing, color: col })}
                      className={`w-7 h-7 rounded-full cursor-pointer transition-transform duration-100 ${
                        editing.color === col ? "scale-110 ring-2 ring-offset-2 ring-offset-white ring-[#6F4E37]" : "hover:scale-105"
                      }`}
                      style={{ background: col }}
                    />
                  ))}
                </div>
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
              Save Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
