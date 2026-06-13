import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Users, Check, Clock, Coffee, UtensilsCrossed } from "lucide-react";

export const Route = createFileRoute("/pos/tables")({ component: TablesView });

function TablesView() {
  const floors = useStore((s) => s.floors);
  const tables = useStore((s) => s.tables);
  const orders = useStore((s) => s.orders);
  const currentTableId = useStore((s) => s.currentTableId);
  const setCurrentTable = useStore((s) => s.setCurrentTable);
  const navigate = useNavigate();

  // Filters state
  const [activeFloorId, setActiveFloorId] = useState(null);
  const [capacityFilter, setCapacityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Sync activeFloorId if not set
  if (!activeFloorId && floors.length > 0) {
    setActiveFloorId(floors[0].id);
  }

  const getDraftOrder = (tableId) =>
    orders.find((o) => o.tableId === tableId && o.status === "Draft");

  // Compute table statistics for active floor
  const floorTables = tables.filter((t) => t.floorId === activeFloorId && t.active);
  const totalTablesCount = floorTables.length;
  const occupiedTablesCount = floorTables.filter((t) => getDraftOrder(t.id)).length;
  const availableTablesCount = totalTablesCount - occupiedTablesCount;
  const occupancyRate = totalTablesCount ? Math.round((occupiedTablesCount / totalTablesCount) * 100) : 0;

  // Filtered tables list
  const filteredTables = floorTables.filter((t) => {
    const isOccupied = !!getDraftOrder(t.id);
    
    // Status Filter
    if (statusFilter === "available" && isOccupied) return false;
    if (statusFilter === "occupied" && !isOccupied) return false;

    // Capacity Filter
    if (capacityFilter === "2" && t.seats !== 2) return false;
    if (capacityFilter === "4" && t.seats !== 4) return false;
    if (capacityFilter === "6+" && t.seats < 6) return false;

    return true;
  });

  const formatTimeAgo = (timestamp) => {
    const diffMins = Math.floor((Date.now() - timestamp) / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  };

  // Helper to render chairs around the table top SVG
  const renderChairs = (seats, statusColor) => {
    const chairs = [];
    const radius = 22; // distance from center
    const count = Math.min(seats, 8); // cap visual seats at 8
    for (let i = 0; i < count; i++) {
      const angle = (i * 2 * Math.PI) / count - Math.PI / 2;
      const cx = 50 + radius * Math.cos(angle);
      const cy = 50 + radius * Math.sin(angle);
      chairs.push(
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r="6"
          className={`${statusColor} transition-all duration-300`}
        />
      );
    }
    return chairs;
  };

  return (
    <div className="p-6 bg-[#FAF3E0] text-[#2B2118] min-h-[calc(100vh-4rem)] space-y-6 select-none">
      {/* Header section with Stats Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#6F4E37]/30 shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#6F4E37]/10 text-[#6F4E37] rounded-lg">
              <Coffee className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#6F4E37]">Floor & Tables</h1>
          </div>
          <p className="text-sm text-[#6F4E37]/60">Select a table to manage its order session.</p>
        </div>

        {/* Real-time stats widgets */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3 bg-[#FAF3E0]/40 px-4 py-2.5 rounded-xl border border-[#6F4E37]/20 shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <div className="text-[10px] uppercase font-bold text-[#6F4E37]/60">Available</div>
              <div className="text-sm font-extrabold text-[#6F4E37]">{availableTablesCount} Tables</div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#FAF3E0]/40 px-4 py-2.5 rounded-xl border border-[#6F4E37]/20 shadow-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-[#6F4E37]" />
            <div>
              <div className="text-[10px] uppercase font-bold text-[#6F4E37]/60">Occupied</div>
              <div className="text-sm font-extrabold text-[#6F4E37]">{occupiedTablesCount} Tables</div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-[#FAF3E0]/40 px-4 py-2.5 rounded-xl border border-[#6F4E37]/20 shadow-sm min-w-32">
            <div className="w-full">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] uppercase font-bold text-[#6F4E37]/60">Occupancy</span>
                <span className="text-xs font-extrabold text-[#6F4E37]">{occupancyRate}%</span>
              </div>
              <div className="w-full bg-[#FAF3E0] h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#6F4E37] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${occupancyRate}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Floor Tabs & Grid Filters */}
      <div className="flex flex-col gap-4 border-b border-[#6F4E37]/10 pb-4">
        {/* Floor Selection Tab Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {floors.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setActiveFloorId(f.id);
              }}
              className={`px-5 py-2.5 rounded-xl text-sm font-extrabold tracking-wide transition-all duration-200 shrink-0 cursor-pointer ${
                activeFloorId === f.id
                  ? "bg-[#6F4E37] text-white shadow-md shadow-[#6F4E37]/15 scale-[1.02]"
                  : "bg-white hover:bg-[#FAF3E0]/80 text-[#6F4E37]/80 border border-[#6F4E37]/15 hover:border-[#6F4E37]/30"
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Capacity Filters */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-[#6F4E37]/20">
            {["all", "2", "4", "6+"].map((cap) => (
              <button
                key={cap}
                onClick={() => setCapacityFilter(cap)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  capacityFilter === cap
                    ? "bg-[#6F4E37] text-white shadow-sm font-extrabold"
                    : "text-[#6F4E37]/70 hover:bg-[#FAF3E0]"
                }`}
              >
                {cap === "all" ? "All Sizes" : cap === "6+" ? "6+ Seats" : `${cap} Seats`}
              </button>
            ))}
          </div>

          {/* Status Filters */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-[#6F4E37]/20">
            {[
              { id: "all", label: "All Status" },
              { id: "available", label: "Available" },
              { id: "occupied", label: "Occupied" },
            ].map((status) => (
              <button
                key={status.id}
                onClick={() => setStatusFilter(status.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  statusFilter === status.id
                    ? "bg-[#6F4E37] text-white shadow-sm font-extrabold"
                    : "text-[#6F4E37]/70 hover:bg-[#FAF3E0]"
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Tables */}
      {filteredTables.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {filteredTables.map((t) => {
            const draftOrder = getDraftOrder(t.id);
            const isBusy = !!draftOrder;
            const isSelected = currentTableId === t.id;

            // Define styling colors based on table status
            let borderStyle = "border-[#6F4E37]/20 bg-white hover:border-[#6F4E37]/55 hover:shadow-lg";
            let statusBadge = "bg-[#FAF3E0] text-emerald-600 border border-emerald-200";
            let statusText = "Available";
            let tableColor = "fill-[#D4A373]/10 stroke-[#6F4E37]/70 group-hover:stroke-[#6F4E37]";
            let chairColor = "fill-emerald-500";
            let overlayTextColor = "text-[#6F4E37]";

            if (isBusy) {
              borderStyle = "border-[#6F4E37] bg-[#6F4E37]/5 hover:bg-[#6F4E37]/10 hover:shadow-lg";
              statusBadge = "bg-[#6F4E37] text-white";
              statusText = "Occupied";
              tableColor = "fill-[#6F4E37]/10 stroke-[#6F4E37]";
              chairColor = "fill-[#6F4E37]";
              overlayTextColor = "text-[#6F4E37]";
            }

            if (isSelected) {
              borderStyle = "ring-2 ring-[#6F4E37] border-[#6F4E37] bg-[#6F4E37]/10 shadow-md";
            }

            return (
              <button
                key={t.id}
                onClick={() => {
                  setCurrentTable(t.id);
                  navigate({ to: "/pos" });
                }}
                className={`relative group rounded-2xl border p-4 flex flex-col items-center justify-between text-left transition-all duration-300 hover:-translate-y-1 cursor-pointer outline-none ${borderStyle}`}
              >
                {/* Top header line of table card */}
                <div className="w-full flex items-center justify-between mb-3">
                  <span className={`text-[9px] font-extrabold tracking-wider uppercase px-2 py-0.5 rounded-full ${statusBadge}`}>
                    {statusText}
                  </span>
                  <div className="flex items-center gap-1.5 text-[#6F4E37]/70">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold">{t.seats}</span>
                  </div>
                </div>

                {/* Custom Table & Chairs SVG Graphic */}
                <div className="w-24 h-24 my-2 relative flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    {/* Render Chairs */}
                    {renderChairs(t.seats, chairColor)}

                    {/* Table Shape in the Center */}
                    {t.seats >= 6 ? (
                      <rect
                        x="32"
                        y="38"
                        width="36"
                        height="24"
                        rx="6"
                        className={`${tableColor} transition-all duration-300`}
                        strokeWidth="3.5"
                      />
                    ) : (
                      <circle
                        cx="50"
                        cy="50"
                        r="18"
                        className={`${tableColor} transition-all duration-300`}
                        strokeWidth="3.5"
                      />
                    )}
                  </svg>

                  {/* Table Number Overlay */}
                  <span className={`absolute text-xl font-extrabold tracking-tight ${overlayTextColor} group-hover:scale-110 transition-transform duration-300`}>
                    {t.number}
                  </span>
                </div>

                {/* Footer section of table card */}
                <div className="w-full border-t border-[#6F4E37]/10 pt-3 mt-2 flex flex-col gap-1.5 items-center text-center">
                  {isBusy ? (
                    <div className="w-full">
                      <div className="text-xs font-extrabold text-[#6F4E37]">
                        ₹{draftOrder.total.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-[#6F4E37]/60 flex items-center justify-center gap-1 mt-0.5 font-semibold">
                        <Clock className="w-3 h-3 text-[#6F4E37]" />
                        <span>{formatTimeAgo(draftOrder.createdAt)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Ready to seat</span>
                    </div>
                  )}
                </div>

                {/* Selection Checkmark Badge */}
                {isSelected && (
                  <div className="absolute -top-2.5 -right-2 bg-[#6F4E37] text-white rounded-full p-1 shadow-md border border-white">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white border-2 border-dashed border-[#6F4E37]/25 rounded-3xl p-12 text-center max-w-md mx-auto">
          <UtensilsCrossed className="w-12 h-12 text-[#6F4E37]/40 mx-auto mb-4" />
          <h3 className="text-base font-bold text-[#6F4E37]">No tables match filters</h3>
          <p className="text-xs text-[#6F4E37]/60 mt-1 font-semibold">
            Try resetting your seat capacity or availability filters to find tables.
          </p>
          <button
            onClick={() => {
              setCapacityFilter("all");
              setStatusFilter("all");
            }}
            className="mt-4 px-4 py-2 bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
