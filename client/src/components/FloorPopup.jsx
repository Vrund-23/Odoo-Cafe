import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { Users } from "lucide-react";

export function FloorPopup({ open, onSelect, onOpenChange }) {
  const floors = useStore((s) => s.floors);
  const tables = useStore((s) => s.tables);
  const orders = useStore((s) => s.orders);

  const hasOrder = (tid) =>
    orders.some((o) => o.tableId === tid && o.status === "Draft");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-white border border-[#6F4E37]/20 text-[#2B2118] rounded-3xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#2B2118] font-extrabold text-lg">Select a Table</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
          {floors.map((f) => (
            <div key={f.id} className="border-t border-[#6F4E37]/10 pt-4 first:border-0 first:pt-0">
              <h3 className="font-extrabold text-sm text-[#6F4E37] uppercase tracking-wider mb-3">{f.name}</h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {tables
                  .filter((t) => t.floorId === f.id && t.active)
                  .map((t) => {
                    const activeOrder = orders.find((o) => o.tableId === t.id && o.status === "Draft");
                    const busy = !!activeOrder;
                    const customer = busy ? useStore.getState().customers.find(c => c.id === activeOrder.customerId) : null;
                    
                    return (
                      <button
                        key={t.id}
                        onClick={() => onSelect(t.id)}
                        className={`aspect-square rounded-2xl border flex flex-col items-center justify-center transition-all duration-200 hover:scale-[1.03] cursor-pointer ${
                          busy
                            ? "border-[#6F4E37] bg-[#6F4E37]/10 shadow-sm"
                            : "border-[#6F4E37]/20 bg-[#FAF3E0] hover:bg-[#D4A373]/15 hover:border-[#D4A373]"
                        }`}
                      >
                        <span className="text-2xl font-extrabold text-[#2B2118]">{t.number}</span>
                        <span className="text-xs flex items-center gap-1 text-[#6F4E37]/60 font-semibold mt-1">
                          <Users className="w-3.5 h-3.5 text-[#6F4E37]/50" />
                          {t.seats}
                        </span>
                        {busy ? (
                          <div className="flex flex-col items-center mt-1">
                            <span className="text-[9px] text-[#6F4E37] font-extrabold uppercase tracking-wider">Occupied</span>
                            {customer && <span className="text-[10px] text-[#2B2118] font-bold truncate max-w-[70px] leading-tight">{customer.name.split(' ')[0]}</span>}
                          </div>
                        ) : (
                          <span className="text-[9px] text-[#6B8E6E] font-extrabold uppercase tracking-wider mt-1">Available</span>
                        )}
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
