import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/categories")({ component: CategoriesPage });

const COLORS = ["#F59E0B", "#EC4899", "#10B981", "#3B82F6", "#8B5CF6", "#EF4444", "#06B6D4"];

function CategoriesPage() {
  const categories = useStore((s) => s.categories);
  const upsert = useStore((s) => s.upsertCategory);
  const del = useStore((s) => s.deleteCategory);

  const addNew = () => {
    upsert({
      id: "c-" + Math.random().toString(36).slice(2, 6),
      name: "New Category",
      color: COLORS[categories.length % COLORS.length],
    });
  };

  return (
    <AdminShell title="Category">
      <Button 
        onClick={addNew} 
        className="mb-4 bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white font-bold rounded-xl cursor-pointer"
      >
        <Plus className="w-4 h-4 mr-1" /> New Category
      </Button>
      <Card className="bg-white border border-[#6F4E37]/25 rounded-3xl overflow-hidden shadow-md text-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#FAF3E0] border-b border-[#6F4E37]/20">
              <tr>
                <th className="p-3 text-left font-bold text-[#6F4E37]/80">Name</th>
                <th className="p-3 text-left font-bold text-[#6F4E37]/80">Color</th>
                <th className="p-3 w-16 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-[#6F4E37]/10 last:border-0 hover:bg-[#FAF3E0]/10 transition duration-150">
                  <td className="p-3">
                    <Input
                      value={c.name}
                      onChange={(e) => upsert({ ...c, name: e.target.value })}
                      className="max-w-xs bg-[#FAF3E0] text-white border-[#6F4E37]/20 focus:border-[#6F4E37] rounded-xl font-semibold"
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1.5">
                      {COLORS.map((col) => (
                        <button
                          key={col}
                          onClick={() => upsert({ ...c, color: col })}
                          className={`w-6 h-6 rounded-full cursor-pointer transition-transform duration-100 ${
                            c.color === col ? "scale-110 ring-2 ring-offset-2 ring-offset-[#16181E] ring-white" : "hover:scale-105"
                          }`}
                          style={{ background: col }}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => del(c.id)}
                      className="hover:bg-red-500/10 text-[#6F4E37]/60 hover:text-red-400 h-8 w-8 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminShell>
  );
}
