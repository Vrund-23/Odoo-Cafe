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
      <div className="flex gap-2 mb-6">
        <Input 
          placeholder="New floor name..." 
          value={newFloor} 
          onChange={(e) => setNewFloor(e.target.value)} 
          className="max-w-xs bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/30 focus:border-[#6F4E37] rounded-xl" 
        />
        <Button
          onClick={() => {
            if (!newFloor) return;
            upsertFloor({ id: "f-" + Math.random().toString(36).slice(2, 6), name: newFloor });
            setNewFloor("");
          }}
          className="bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white font-bold rounded-xl cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1" /> Floor
        </Button>
      </div>
      <div className="space-y-6">
        {floors.map((f) => {
          const fTables = tables.filter((t) => t.floorId === f.id);
          return (
            <Card key={f.id} className="p-5 bg-white border border-[#6F4E37]/25 rounded-3xl shadow-md text-[#2B2118]">
              <div className="flex items-center justify-between mb-4 border-b border-[#6F4E37]/10 pb-3">
                <Input
                  value={f.name}
                  onChange={(e) => upsertFloor({ ...f, name: e.target.value })}
                  className="max-w-xs font-bold text-[#2B2118] bg-[#FAF3E0] border-[#6F4E37]/20 focus:border-[#6F4E37] rounded-xl"
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
                    className="bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white font-semibold rounded-xl cursor-pointer"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Table
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => deleteFloor(f.id)}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-semibold rounded-xl cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#FAF3E0] border-b border-[#6F4E37]/20">
                    <tr>
                      <th className="p-3 text-left font-bold text-[#6F4E37]/80">Table #</th>
                      <th className="p-3 text-left font-bold text-[#6F4E37]/80">Seats</th>
                      <th className="p-3 text-left font-bold text-[#6F4E37]/80">Active</th>
                      <th className="p-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {fTables.map((t) => (
                      <tr key={t.id} className="border-b border-[#6F4E37]/10 last:border-0 hover:bg-[#FAF3E0]/10 transition duration-150">
                        <td className="p-3">
                          <Input
                            type="number"
                            value={t.number}
                            onChange={(e) => upsertTable({ ...t, number: parseInt(e.target.value) || 0 })}
                            className="w-24 bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/20 focus:border-[#6F4E37] rounded-xl font-bold"
                          />
                        </td>
                        <td className="p-3">
                          <Input
                            type="number"
                            value={t.seats}
                            onChange={(e) => upsertTable({ ...t, seats: parseInt(e.target.value) || 0 })}
                            className="w-24 bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/20 focus:border-[#6F4E37] rounded-xl font-bold"
                          />
                        </td>
                        <td className="p-3">
                          <Switch 
                            checked={t.active} 
                            onCheckedChange={(v) => upsertTable({ ...t, active: v })}
                            className="data-[state=checked]:bg-[#6F4E37]"
                          />
                        </td>
                        <td className="p-3 text-right">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => deleteTable(t.id)}
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
          );
        })}
      </div>
    </AdminShell>
  );
}
