import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import {
  Users, Clock, Coffee, UtensilsCrossed, CreditCard,
  Phone, Mail, User, IndianRupee, CheckCircle2, Utensils
} from "lucide-react";

export default function TablesView() {
  const floors = useStore((s) => s.floors);
  const tables = useStore((s) => s.tables);
  const orders = useStore((s) => s.orders);
  const customers = useStore((s) => s.customers);
  const setCurrentTable = useStore((s) => s.setCurrentTable);
  const setDraftOrder = useStore((s) => s.setDraftOrder);
  const navigate = useNavigate();

  const [activeFloorId, setActiveFloorId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  if (!activeFloorId && floors.length > 0) {
    setActiveFloorId(floors[0].id);
  }

  const getDraftOrder = (tableId) =>
    orders.find((o) => o.tableId === tableId && o.status === "Draft");

  const floorTables = tables.filter((t) => t.floorId === activeFloorId && t.active);
  const occupiedCount = floorTables.filter((t) => !!getDraftOrder(t.id)).length;
  const availableCount = floorTables.length - occupiedCount;
  const occupancyRate = floorTables.length
    ? Math.round((occupiedCount / floorTables.length) * 100)
    : 0;

  const filteredTables = floorTables.filter((t) => {
    const isOccupied = !!getDraftOrder(t.id);
    if (statusFilter === "available" && isOccupied) return false;
    if (statusFilter === "occupied" && !isOccupied) return false;
    return true;
  });

  const formatTimeAgo = (timestamp) => {
    const diffMins = Math.floor((Date.now() - timestamp) / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
  };

  const handleTakePayment = (e, tableId, orderId) => {
    e.stopPropagation();
    setCurrentTable(tableId);
    setDraftOrder(orderId);
    navigate("/pos");
  };

  const handleGoToOrder = (tableId, orderId) => {
    setCurrentTable(tableId);
    setDraftOrder(orderId);
    navigate("/pos");
  };

  return (
    <div className="p-6 bg-[#FAF3E0] text-[#2B2118] min-h-[calc(100vh-4rem)] space-y-5 select-none">

      {/* Header + Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#6F4E37]/20 shadow-md">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-[#6F4E37]/10 text-[#6F4E37] rounded-xl">
            <Utensils className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-[#6F4E37]">Table Status</h1>
            <p className="text-xs text-[#6F4E37]/50 font-medium">Live overview — click occupied table to take payment</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-700">{availableCount} Available</span>
          </div>
          <div className="flex items-center gap-2 bg-[#6F4E37]/10 border border-[#6F4E37]/20 px-4 py-2 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-[#6F4E37]" />
            <span className="text-xs font-bold text-[#6F4E37]">{occupiedCount} Occupied</span>
          </div>
          <div className="flex items-center gap-2 bg-white border border-[#6F4E37]/20 px-4 py-2 rounded-xl min-w-32">
            <div className="flex-1">
              <div className="flex justify-between mb-1">
                <span className="text-[10px] font-bold text-[#6F4E37]/50 uppercase">Occupancy</span>
                <span className="text-[10px] font-extrabold text-[#6F4E37]">{occupancyRate}%</span>
              </div>
              <div className="h-1.5 bg-[#FAF3E0] rounded-full overflow-hidden">
                <div className="h-full bg-[#6F4E37] rounded-full transition-all duration-500" style={{ width: `${occupancyRate}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floor Tabs + Status Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {floors.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFloorId(f.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition shrink-0 cursor-pointer ${
                activeFloorId === f.id
                  ? "bg-[#6F4E37] text-white shadow-sm"
                  : "bg-white border border-[#6F4E37]/20 text-[#6F4E37]/70 hover:bg-[#FAF3E0]"
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
        <div className="flex bg-white border border-[#6F4E37]/20 rounded-xl p-1 gap-1">
          {[
            { id: "all", label: "All" },
            { id: "available", label: "Available" },
            { id: "occupied", label: "Occupied" },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === s.id
                  ? "bg-[#6F4E37] text-white"
                  : "text-[#6F4E37]/60 hover:bg-[#FAF3E0]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Grid */}
      {filteredTables.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTables.map((t) => {
            const draftOrder = getDraftOrder(t.id);
            const isBusy = !!draftOrder;
            const customer = isBusy ? customers.find((c) => c.id === draftOrder.customerId) : null;

            if (!isBusy) {
              return (
                <div
                  key={t.id}
                  className="bg-white border border-[#6F4E37]/15 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 min-h-[140px] text-center"
                >
                  <span className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                    <Coffee className="w-5 h-5 text-emerald-500" />
                  </span>
                  <div>
                    <div className="text-lg font-extrabold text-[#2B2118]">Table {t.number}</div>
                    <div className="flex items-center justify-center gap-1 text-[#6F4E37]/50 text-xs font-semibold">
                      <Users className="w-3 h-3" /> {t.seats} seats
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    Available
                  </span>
                </div>
              );
            }

            // Occupied table card — rich with customer info
            return (
              <div
                key={t.id}
                className="bg-white border border-[#6F4E37]/30 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer group"
                onClick={() => handleGoToOrder(t.id, draftOrder.id)}
              >
                {/* Card Header */}
                <div className="bg-[#6F4E37] px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-extrabold text-base">Table {t.number}</span>
                    <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                      Occupied
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/80 text-xs font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTimeAgo(draftOrder.createdAt)}
                  </div>
                </div>

                {/* Customer Details */}
                <div className="px-4 pt-3 pb-2 space-y-1.5">
                  {customer ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#6F4E37]/10 flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-[#6F4E37]" />
                        </div>
                        <span className="font-extrabold text-[#2B2118] text-sm truncate">{customer.name}</span>
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-2 pl-0.5">
                          <Phone className="w-3 h-3 text-[#6F4E37]/50 shrink-0" />
                          <span className="text-xs text-[#6F4E37]/70 font-medium">{customer.phone}</span>
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center gap-2 pl-0.5">
                          <Mail className="w-3 h-3 text-[#6F4E37]/50 shrink-0" />
                          <span className="text-xs text-[#6F4E37]/70 font-medium truncate">{customer.email}</span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-[#6F4E37]/50">
                      <User className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium italic">No customer info</span>
                    </div>
                  )}
                </div>

                {/* Order Info */}
                <div className="px-4 py-2 mx-3 mb-2 bg-[#FAF3E0] rounded-xl border border-[#6F4E37]/10 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-[#6F4E37]/50 font-bold uppercase tracking-wide">
                      {draftOrder.lines?.length || 0} item{draftOrder.lines?.length !== 1 ? "s" : ""} · Pending
                    </div>
                    <div className="flex items-center gap-0.5 text-[#6F4E37] font-extrabold text-base">
                      <IndianRupee className="w-3.5 h-3.5" />
                      {draftOrder.total.toFixed(2)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[#6F4E37]/40">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">{t.seats}</span>
                  </div>
                </div>

                {/* Take Payment Button */}
                <div className="px-3 pb-3">
                  <button
                    onClick={(e) => handleTakePayment(e, t.id, draftOrder.id)}
                    className="w-full py-2.5 bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer group-hover:shadow-md"
                  >
                    <CreditCard className="w-4 h-4" />
                    Take Payment
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-[#6F4E37]/20 rounded-3xl p-14 text-center">
          <UtensilsCrossed className="w-12 h-12 text-[#6F4E37]/30 mx-auto mb-4" />
          <h3 className="text-base font-bold text-[#6F4E37]">No tables match filters</h3>
          <p className="text-xs text-[#6F4E37]/50 mt-1 font-medium">Try changing the filter above.</p>
          <button
            onClick={() => setStatusFilter("all")}
            className="mt-4 px-4 py-2 bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Show All
          </button>
        </div>
      )}
    </div>
  );
}
