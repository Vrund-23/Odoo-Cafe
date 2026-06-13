import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { Users } from "lucide-react";

export function FloorPopup({
  open,
  onSelect,
  onOpenChange,
}: {
  open: boolean;
  onSelect: (tableId: string) => void;
  onOpenChange: (v: boolean) => void;
}) {
  const floors = useStore((s) => s.floors);
  const tables = useStore((s) => s.tables);
  const orders = useStore((s) => s.orders);

  const hasOrder = (tid: string) =>
    orders.some((o) => o.tableId === tid && o.status === "Draft");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select a Table</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          {floors.map((f) => (
            <div key={f.id}>
              <h3 className="font-semibold mb-2">{f.name}</h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {tables
                  .filter((t) => t.floorId === f.id && t.active)
                  .map((t) => {
                    const busy = hasOrder(t.id);
                    return (
                      <button
                        key={t.id}
                        onClick={() => onSelect(t.id)}
                        className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center transition hover:scale-105 ${
                          busy
                            ? "border-amber-500 bg-amber-100"
                            : "border-emerald-500 bg-emerald-50 hover:bg-emerald-100"
                        }`}
                      >
                        <span className="text-2xl font-bold">{t.number}</span>
                        <span className="text-xs flex items-center gap-1 text-muted-foreground">
                          <Users className="w-3 h-3" />
                          {t.seats}
                        </span>
                        {busy && <span className="text-[10px] text-amber-700 font-medium">Active</span>}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
