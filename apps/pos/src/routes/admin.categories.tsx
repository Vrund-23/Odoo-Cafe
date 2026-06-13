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
      <Button onClick={addNew} className="mb-3">
        <Plus className="w-4 h-4 mr-1" /> New
      </Button>
      <Card>
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Color</th>
              <th className="p-2 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="p-2">
                  <Input
                    value={c.name}
                    onChange={(e) => upsert({ ...c, name: e.target.value })}
                    className="max-w-xs"
                  />
                </td>
                <td className="p-2">
                  <div className="flex gap-1">
                    {COLORS.map((col) => (
                      <button
                        key={col}
                        onClick={() => upsert({ ...c, color: col })}
                        className={`w-6 h-6 rounded-full ${c.color === col ? "ring-2 ring-offset-2 ring-black" : ""}`}
                        style={{ background: col }}
                      />
                    ))}
                  </div>
                </td>
                <td className="p-2">
                  <Button size="icon" variant="ghost" onClick={() => del(c.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </AdminShell>
  );
}
