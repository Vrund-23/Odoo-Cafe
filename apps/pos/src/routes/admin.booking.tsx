import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/booking")({ component: BookingPage });

function BookingPage() {
  const floors = useStore((s) => s.floors);
  const tables = useStore((s) => s.tables);
  const upsertFloor = useStore((s) => s.upsertFloor);
  const deleteFloor = useStore((s) => s.deleteFloor);
  const upsertTable = useStore((s) => s.upsertTable);
  const deleteTable = useStore((s) => s.deleteTable);
  const [newFloor, setNewFloor] = useState("");

  return (
    <AdminShell title="Floor & Table Management">
      <div className="flex gap-2 mb-4">
        <Input placeholder="New floor name" value={newFloor} onChange={(e) => setNewFloor(e.target.value)} className="max-w-xs" />
        <Button
          onClick={() => {
            if (!newFloor) return;
            upsertFloor({ id: "f-" + Math.random().toString(36).slice(2, 6), name: newFloor });
            setNewFloor("");
          }}
        >
          <Plus className="w-4 h-4 mr-1" /> Floor
        </Button>
      </div>
      <div className="space-y-4">
        {floors.map((f) => {
          const fTables = tables.filter((t) => t.floorId === f.id);
          return (
            <Card key={f.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <Input
                  value={f.name}
                  onChange={(e) => upsertFloor({ ...f, name: e.target.value })}
                  className="max-w-xs font-semibold"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      const num = (fTables.reduce((m, t) => Math.max(m, t.number), 0) || 0) + 1;
                      upsertTable({
                        id: "t-" + Math.random().toString(36).slice(2, 6),
                        floorId: f.id,
                        number: num,
                        seats: 4,
                        active: true,
                      });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-1" /> Table
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteFloor(f.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="p-2 text-left">Table #</th>
                    <th className="p-2 text-left">Seats</th>
                    <th className="p-2 text-left">Active</th>
                    <th className="p-2 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {fTables.map((t) => (
                    <tr key={t.id} className="border-t">
                      <td className="p-2">
                        <Input
                          type="number"
                          value={t.number}
                          onChange={(e) => upsertTable({ ...t, number: parseInt(e.target.value) || 0 })}
                          className="w-20"
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          value={t.seats}
                          onChange={(e) => upsertTable({ ...t, seats: parseInt(e.target.value) || 0 })}
                          className="w-20"
                        />
                      </td>
                      <td className="p-2">
                        <Switch checked={t.active} onCheckedChange={(v) => upsertTable({ ...t, active: v })} />
                      </td>
                      <td className="p-2">
                        <Button size="icon" variant="ghost" onClick={() => deleteTable(t.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          );
        })}
      </div>
    </AdminShell>
  );
}
