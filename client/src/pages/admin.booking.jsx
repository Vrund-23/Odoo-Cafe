import { useState, useEffect, useCallback } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, Pencil, Loader2, Building2, Table2 } from "lucide-react";
import { toast } from "sonner";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getAuthHeaders = () => {
  const headers = { "Content-Type": "application/json" };
  try {
    const raw = localStorage.getItem("cafe-auth-token");
    const token = raw ? raw.replace(/^"|"$/g, "") : null;
    if (token) headers["Authorization"] = `Bearer ${token}`;
  } catch (_) {}
  return headers;
};

export default function BookingPage() {
  // ── State ─────────────────────────────────────────────────
  const [floors, setFloors] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  // Floor dialog
  const [floorOpen, setFloorOpen] = useState(false);
  const [floorName, setFloorName] = useState("");
  const [editingFloor, setEditingFloor] = useState(null); // null = create
  const [savingFloor, setSavingFloor] = useState(false);

  // Table dialog
  const [tableOpen, setTableOpen] = useState(false);
  const [tableFloorId, setTableFloorId] = useState(null);
  const [tableNumber, setTableNumber] = useState("");
  const [tableSeats, setTableSeats] = useState("4");
  const [editingTable, setEditingTable] = useState(null);
  const [savingTable, setSavingTable] = useState(false);

  // Sync to global Zustand store so POS picks changes immediately
  const storeUpsertFloor = useStore((s) => s.syncFloor);
  const storeDeleteFloor = useStore((s) => s.syncDeleteFloor);
  const storeUpsertTable = useStore((s) => s.syncTable);
  const storeDeleteTable = useStore((s) => s.syncDeleteTable);

  // ── Helpers ───────────────────────────────────────────────
  const normaliseFloor = (f) => ({
    id: f.id,
    name: f.name,
  });

  const normaliseTable = (t) => ({
    id: t.id,
    floorId: t.floorId,
    number: Number((t.tableNumber || "").toString().replace(/\D/g, "")) || Number(t.tableNumber) || 0,
    tableNumber: t.tableNumber,
    seats: Number(t.seats),
    active: t.isActive ?? t.active ?? true,
  });

  // ── Load data ─────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [fRes, tRes] = await Promise.all([
        fetch(`${BASE_URL}/floors`, { headers: getAuthHeaders() }),
        fetch(`${BASE_URL}/tables`, { headers: getAuthHeaders() }),
      ]);
      const fJson = await fRes.json();
      const tJson = await tRes.json();
      const floorData = Array.isArray(fJson.data) ? fJson.data : (Array.isArray(fJson) ? fJson : []);
      const tableData = Array.isArray(tJson.data) ? tJson.data : (Array.isArray(tJson) ? tJson : []);
      setFloors(floorData.map(normaliseFloor));
      setTables(tableData.map(normaliseTable));
    } catch (err) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Floor CRUD ────────────────────────────────────────────
  const openAddFloor = () => {
    setEditingFloor(null);
    setFloorName("");
    setFloorOpen(true);
  };

  const openEditFloor = (f) => {
    setEditingFloor(f);
    setFloorName(f.name);
    setFloorOpen(true);
  };

  const saveFloor = async () => {
    if (!floorName.trim()) return toast.error("Floor name is required");
    setSavingFloor(true);
    try {
      if (editingFloor) {
        // Update
        const res = await fetch(`${BASE_URL}/floors/${editingFloor.id}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ name: floorName.trim() }),
        });
        if (!res.ok) throw new Error((await res.json()).message || "Failed to update floor");
        const json = await res.json();
        const updated = normaliseFloor(json.data || json);
        setFloors((prev) => prev.map((f) => f.id === updated.id ? updated : f));
        storeUpsertFloor(updated);
        toast.success("Floor updated");
      } else {
        // Create
        const res = await fetch(`${BASE_URL}/floors`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ name: floorName.trim() }),
        });
        if (!res.ok) throw new Error((await res.json()).message || "Failed to create floor");
        const json = await res.json();
        const created = normaliseFloor(json.data || json);
        setFloors((prev) => [...prev, created]);
        storeUpsertFloor(created);
        toast.success("Floor added");
      }
      setFloorOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingFloor(false);
    }
  };

  const deleteFloor = async (id) => {
    if (!confirm("Delete this floor and all its tables?")) return;
    try {
      const res = await fetch(`${BASE_URL}/floors/${id}`, { method: "DELETE", headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to delete floor");
      setFloors((prev) => prev.filter((f) => f.id !== id));
      setTables((prev) => prev.filter((t) => t.floorId !== id));
      storeDeleteFloor(id);
      toast.success("Floor deleted");
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ── Table CRUD ────────────────────────────────────────────
  const openAddTable = (floorId) => {
    const floorTables = tables.filter((t) => t.floorId === floorId);
    const nextNum = (floorTables.reduce((m, t) => Math.max(m, t.number), 0)) + 1;
    setEditingTable(null);
    setTableFloorId(floorId);
    setTableNumber(String(nextNum));
    setTableSeats("4");
    setTableOpen(true);
  };

  const openEditTable = (t) => {
    setEditingTable(t);
    setTableFloorId(t.floorId);
    setTableNumber(String(t.number));
    setTableSeats(String(t.seats));
    setTableOpen(true);
  };

  const saveTable = async () => {
    if (!tableNumber.trim()) return toast.error("Table number is required");
    setSavingTable(true);
    try {
      const body = {
        floorId: tableFloorId,
        tableNumber: `Table ${tableNumber}`,
        seats: parseInt(tableSeats) || 4,
      };
      if (editingTable) {
        // Update
        const res = await fetch(`${BASE_URL}/tables/${editingTable.id}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ tableNumber: body.tableNumber, seats: body.seats }),
        });
        if (!res.ok) throw new Error((await res.json()).message || "Failed to update table");
        const json = await res.json();
        const updated = normaliseTable(json.data || json);
        setTables((prev) => prev.map((t) => t.id === updated.id ? updated : t));
        storeUpsertTable(updated);
        toast.success("Table updated");
      } else {
        // Create
        const res = await fetch(`${BASE_URL}/tables`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).message || "Failed to create table");
        const json = await res.json();
        const created = normaliseTable(json.data || json);
        setTables((prev) => [...prev, created]);
        storeUpsertTable(created);
        toast.success("Table added");
      }
      setTableOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingTable(false);
    }
  };

  const deleteTable = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/tables/${id}`, { method: "DELETE", headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to delete table");
      setTables((prev) => prev.filter((t) => t.id !== id));
      storeDeleteTable(id);
      toast.success("Table deleted");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleTableActive = async (t) => {
    try {
      const res = await fetch(`${BASE_URL}/tables/${t.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ isActive: !t.active }),
      });
      if (!res.ok) throw new Error("Failed to update table");
      const json = await res.json();
      const updated = normaliseTable(json.data || json);
      setTables((prev) => prev.map((x) => x.id === updated.id ? updated : x));
      storeUpsertTable(updated);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // ── Render ────────────────────────────────────────────────
  if (loading) {
    return (
      <AdminShell title="Floor & Table Management">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#6F4E37]" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Floor & Table Management">

      {/* Top action bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-sm text-[#6F4E37]/60 font-medium">
          <Building2 className="w-4 h-4" />
          {floors.length} floor{floors.length !== 1 ? "s" : ""} · {tables.length} table{tables.length !== 1 ? "s" : ""}
        </div>
        <Button
          onClick={openAddFloor}
          className="bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white font-bold rounded-xl cursor-pointer gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Floor
        </Button>
      </div>

      {/* Empty state */}
      {floors.length === 0 && (
        <div className="border-2 border-dashed border-[#6F4E37]/20 rounded-3xl p-16 text-center">
          <Building2 className="w-12 h-12 text-[#6F4E37]/30 mx-auto mb-3" />
          <h3 className="font-bold text-[#6F4E37] text-base">No floors yet</h3>
          <p className="text-sm text-[#6F4E37]/50 mt-1">Click "Add Floor" to create your first floor.</p>
        </div>
      )}

      {/* Floor cards */}
      <div className="space-y-6">
        {floors.map((f) => {
          const fTables = tables.filter((t) => t.floorId === f.id);
          return (
            <Card key={f.id} className="bg-white border border-[#6F4E37]/20 rounded-3xl shadow-md overflow-hidden">
              {/* Floor header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#6F4E37]/10 bg-[#FAF3E0]/40">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#6F4E37]" />
                  <span className="font-extrabold text-[#2B2118] text-base">{f.name}</span>
                  <span className="text-xs text-[#6F4E37]/50 font-medium ml-1">
                    ({fTables.length} table{fTables.length !== 1 ? "s" : ""})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => openAddTable(f.id)}
                    className="bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white font-semibold rounded-xl cursor-pointer gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Table
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditFloor(f)}
                    className="text-[#6F4E37]/60 hover:text-[#6F4E37] hover:bg-[#6F4E37]/10 rounded-xl cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteFloor(f.id)}
                    className="text-red-400/70 hover:text-red-500 hover:bg-red-50 rounded-xl cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Tables list */}
              {fTables.length === 0 ? (
                <div className="py-8 text-center">
                  <Table2 className="w-8 h-8 text-[#6F4E37]/20 mx-auto mb-2" />
                  <p className="text-sm text-[#6F4E37]/40 font-medium">No tables on this floor yet</p>
                  <button
                    onClick={() => openAddTable(f.id)}
                    className="mt-2 text-xs text-[#6F4E37] font-bold underline cursor-pointer"
                  >
                    Add first table
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-[#FAF3E0]/50 border-b border-[#6F4E37]/10">
                      <tr>
                        <th className="p-3 text-left font-bold text-[#6F4E37]/70 text-xs uppercase tracking-wide">Table #</th>
                        <th className="p-3 text-left font-bold text-[#6F4E37]/70 text-xs uppercase tracking-wide">Seats</th>
                        <th className="p-3 text-left font-bold text-[#6F4E37]/70 text-xs uppercase tracking-wide">Status</th>
                        <th className="p-3 w-20"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {fTables.map((t) => (
                        <tr key={t.id} className="border-b border-[#6F4E37]/8 last:border-0 hover:bg-[#FAF3E0]/20 transition">
                          <td className="p-3">
                            <span className="font-extrabold text-[#2B2118] text-base">
                              {t.number}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="inline-flex items-center gap-1 text-[#6F4E37] font-bold text-sm">
                              {t.seats} seats
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={t.active}
                                onCheckedChange={() => toggleTableActive(t)}
                                className="data-[state=checked]:bg-[#6F4E37]"
                              />
                              <span className={`text-xs font-semibold ${t.active ? "text-emerald-600" : "text-red-400"}`}>
                                {t.active ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openEditTable(t)}
                                className="h-8 w-8 rounded-lg text-[#6F4E37]/50 hover:text-[#6F4E37] hover:bg-[#6F4E37]/10 cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteTable(t.id)}
                                className="h-8 w-8 rounded-lg text-red-400/60 hover:text-red-500 hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* ── Floor Dialog ─────────────────────────────────────── */}
      <Dialog open={floorOpen} onOpenChange={setFloorOpen}>
        <DialogContent className="max-w-sm bg-white border border-[#6F4E37]/20 text-[#2B2118] rounded-3xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#2B2118] font-extrabold">
              {editingFloor ? "Edit Floor" : "Add New Floor"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#6F4E37]">Floor Name</Label>
              <Input
                autoFocus
                placeholder="e.g. Ground Floor, First Floor..."
                value={floorName}
                onChange={(e) => setFloorName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveFloor()}
                className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/30 rounded-xl focus:bg-white"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setFloorOpen(false)} className="border-[#6F4E37]/20 text-[#6F4E37]/60 rounded-xl cursor-pointer">
              Cancel
            </Button>
            <Button
              onClick={saveFloor}
              disabled={savingFloor}
              className="bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white font-bold rounded-xl cursor-pointer"
            >
              {savingFloor ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingFloor ? "Save Changes" : "Add Floor")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Table Dialog ─────────────────────────────────────── */}
      <Dialog open={tableOpen} onOpenChange={setTableOpen}>
        <DialogContent className="max-w-sm bg-white border border-[#6F4E37]/20 text-[#2B2118] rounded-3xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#2B2118] font-extrabold">
              {editingTable ? "Edit Table" : "Add New Table"}
            </DialogTitle>
            {tableFloorId && (
              <p className="text-xs text-[#6F4E37]/60 font-medium">
                Floor: {floors.find((f) => f.id === tableFloorId)?.name}
              </p>
            )}
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#6F4E37]">Table Number</Label>
              <Input
                autoFocus
                type="number"
                min="1"
                placeholder="e.g. 1, 2, 3..."
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/30 rounded-xl focus:bg-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#6F4E37]">Number of Seats</Label>
              <div className="grid grid-cols-5 gap-2">
                {[2, 4, 6, 8, 10].map((s) => (
                  <button
                    key={s}
                    onClick={() => setTableSeats(String(s))}
                    className={`py-2 rounded-xl text-sm font-extrabold border transition cursor-pointer ${
                      tableSeats === String(s)
                        ? "bg-[#6F4E37] text-white border-[#6F4E37]"
                        : "bg-[#FAF3E0] text-[#6F4E37] border-[#6F4E37]/25 hover:bg-[#6F4E37]/10"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                min="1"
                placeholder="Custom seat count"
                value={tableSeats}
                onChange={(e) => setTableSeats(e.target.value)}
                className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/30 rounded-xl focus:bg-white text-sm"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTableOpen(false)} className="border-[#6F4E37]/20 text-[#6F4E37]/60 rounded-xl cursor-pointer">
              Cancel
            </Button>
            <Button
              onClick={saveTable}
              disabled={savingTable}
              className="bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white font-bold rounded-xl cursor-pointer"
            >
              {savingTable ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingTable ? "Save Changes" : "Add Table")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </AdminShell>
  );
}
