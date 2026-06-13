import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Users } from "lucide-react";

export const Route = createFileRoute("/pos/tables")({ component: TablesView });

function TablesView() {
  const floors = useStore((s) => s.floors);
  const tables = useStore((s) => s.tables);
  const orders = useStore((s) => s.orders);
  const setCurrentTable = useStore((s) => s.setCurrentTable);
  const navigate = useNavigate();

  const hasOrder = (tid: string) =>
    orders.some((o) => o.tableId === tid && o.status === "Draft");

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Tables</h1>
      {floors.map((f) => (
        <div key={f.id} className="mb-8">
          <h2 className="font-semibold mb-3">{f.name}</h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
            {tables
              .filter((t) => t.floorId === f.id && t.active)
              .map((t) => {
                const busy = hasOrder(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setCurrentTable(t.id);
                      navigate({ to: "/pos" });
                    }}
                    className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition hover:scale-105 ${
                      busy ? "border-amber-500 bg-amber-100" : "border-emerald-500 bg-emerald-50"
                    }`}
                  >
                    <span className="text-2xl font-bold">{t.number}</span>
                    <span className="text-xs flex items-center gap-1 text-muted-foreground">
                      <Users className="w-3 h-3" /> {t.seats}
                    </span>
                    {busy && <span className="text-[10px] text-amber-700 font-medium">Active</span>}
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
