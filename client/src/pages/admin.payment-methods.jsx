import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2, GripVertical, Check } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getAuthHeaders() {
  const headers = { "Content-Type": "application/json" };
  try {
    const raw = localStorage.getItem("cafe-auth-token");
    const token = raw ? raw.replace(/^"|"$/g, "") : null;
    if (token) headers["Authorization"] = `Bearer ${token}`;
  } catch (e) {}
  return headers;
}

function normalisePayment(p) {
  return {
    id: p.id,
    name: p.name || p.type,
    type: p.type,
    upiId: p.upiId ?? null,
    active: p.isEnabled,
  };
}

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);

  const syncPaymentMethod = useStore((s) => s.syncPaymentMethod);
  const syncDeletePaymentMethod = useStore((s) => s.syncDeletePaymentMethod);

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      const res = await fetch(`${BASE_URL}/payment-methods`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch payment methods");
      const json = await res.json();
      const data = json.data || json;
      const normalised = Array.isArray(data) ? data.map(normalisePayment) : [];
      setMethods(normalised);
      if (normalised.length > 0 && !selectedId) {
        setSelectedId(normalised[0].id);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const save = async (m) => {
    try {
      const isNew = m.isNew;
      const url = isNew ? `${BASE_URL}/payment-methods` : `${BASE_URL}/payment-methods/${m.id}`;
      const method = isNew ? "POST" : "PUT";
      
      const payload = {
        name: m.name,
        type: m.type,
        upiId: m.upiId,
        isEnabled: m.active,
      };

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save payment method");
      const json = await res.json();
      const saved = normalisePayment(json.data || json);

      setMethods((prev) => 
        prev.map(x => x.id === m.id ? saved : x)
      );
      if (isNew && selectedId === m.id) {
        setSelectedId(saved.id);
      }
      syncPaymentMethod(saved);
      if (isNew) toast.success("Payment method created");
    } catch (err) {
      toast.error(err.message || "Failed to save payment method");
    }
  };

  const updateSelected = (field, value) => {
    setMethods((prev) => prev.map((m) => (m.id === selectedId ? { ...m, [field]: value } : m)));
  };

  const handleSaveSelected = () => {
    const m = methods.find(x => x.id === selectedId);
    if (m) save(m);
  };

  const addNew = () => {
    const newId = "pm-" + Math.random().toString(36).slice(2, 6);
    const newMethod = {
      id: newId,
      name: "New Method",
      type: "CASH",
      active: false,
      isNew: true,
    };
    setMethods((prev) => [newMethod, ...prev]);
    setSelectedId(newId);
  };

  const del = async (id, isNew) => {
    if (isNew) {
      setMethods((prev) => prev.filter((m) => m.id !== id));
      if (selectedId === id) setSelectedId(null);
      return;
    }
    if (!confirm("Are you sure you want to delete this payment method?")) return;
    try {
      const res = await fetch(`${BASE_URL}/payment-methods/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete payment method");
      
      setMethods((prev) => prev.filter((m) => m.id !== id));
      syncDeletePaymentMethod(id);
      if (selectedId === id) setSelectedId(null);
      toast.success("Deleted");
    } catch (err) {
      toast.error(err.message || "Failed to delete payment method");
    }
  };

  const selectedMethod = methods.find(m => m.id === selectedId);

  return (
    <AdminShell title="Payment Method">
      <div className="max-w-4xl space-y-6">
        
        {/* Top actions */}
        <div>
          <Button 
            onClick={addNew} 
            className="bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white font-bold rounded-xl cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1" /> New
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center p-8 text-[#6F4E37]/60">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <>
            {/* Table View */}
            <div className="bg-white border border-[#6F4E37]/20 rounded-3xl overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#FAF3E0] border-b border-[#6F4E37]/20 text-[#6F4E37]/80 font-bold">
                  <tr>
                    <th className="py-3 px-4 w-10"></th>
                    <th className="py-3 px-4">Payment method Name</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Id</th>
                    <th className="py-3 px-4 w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {methods.map((m) => (
                    <tr 
                      key={m.id} 
                      onClick={() => setSelectedId(m.id)}
                      className={`border-b border-[#6F4E37]/10 last:border-0 cursor-pointer transition ${
                        selectedId === m.id ? "bg-[#6F4E37]/5" : "hover:bg-[#FAF3E0]/30"
                      }`}
                    >
                      <td className="py-3 px-4">
                        <GripVertical className="w-4 h-4 text-[#6F4E37]/40" />
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#2B2118]">
                        {m.name}
                      </td>
                      <td className="py-3 px-4 text-[#6F4E37]">
                        {m.type}
                      </td>
                      <td className="py-3 px-4 text-zinc-500 text-xs">
                        {m.type === "UPI" ? m.upiId : ""}
                      </td>
                      <td className="py-3 px-4">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={(e) => {
                            e.stopPropagation();
                            del(m.id, m.isNew);
                          }}
                          className="hover:bg-red-500/10 text-[#6F4E37]/60 hover:text-red-400 h-8 w-8 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {methods.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#6F4E37]/60">
                        No payment methods configured.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Form View (For selected method) */}
            {selectedMethod && (
              <div className="bg-white border border-[#6F4E37]/20 p-6 rounded-3xl shadow-sm mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* Left Column: Form Fields */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[#2B2118]">Payment method Name</label>
                      <Input
                        value={selectedMethod.name}
                        onChange={(e) => updateSelected("name", e.target.value)}
                        onBlur={handleSaveSelected}
                        className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/20 focus:border-[#6F4E37] rounded-xl font-semibold"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[#2B2118]">Type</label>
                      <Select
                        value={selectedMethod.type}
                        onValueChange={(v) => {
                          updateSelected("type", v);
                          const m = methods.find(x => x.id === selectedId);
                          if (m) save({ ...m, type: v });
                        }}
                      >
                        <SelectTrigger className="w-full md:w-64 bg-[#FAF3E0] border-[#6F4E37]/20 text-[#2B2118] rounded-xl font-semibold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[#6F4E37]/35 text-[#2B2118]">
                          <SelectItem value="CASH">CASH</SelectItem>
                          <SelectItem value="CARD">CARD</SelectItem>
                          <SelectItem value="UPI">UPI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Right Column: UPI specific fields */}
                  {selectedMethod.type === "UPI" && (
                    <div className="border border-[#6F4E37]/20 p-5 rounded-2xl bg-[#FAF3E0]/30 space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-[#2B2118]">UPI ID</label>
                        <Input
                          value={selectedMethod.upiId ?? ""}
                          onChange={(e) => updateSelected("upiId", e.target.value)}
                          onBlur={handleSaveSelected}
                          placeholder="example@upi"
                          className="bg-white text-[#2B2118] border-[#6F4E37]/20 focus:border-[#6F4E37] rounded-xl font-semibold"
                        />
                      </div>
                      
                      <div className="pt-2">
                        <label className="text-sm font-bold text-[#2B2118] block mb-3">QR Preview</label>
                        <div className="flex justify-center p-4 bg-white border border-[#6F4E37]/20 rounded-xl max-w-fit">
                          {selectedMethod.upiId ? (
                            <div className="text-center">
                              <QRCodeCanvas 
                                value={`upi://pay?pa=${selectedMethod.upiId}&cu=INR`} 
                                size={140} 
                                className="mx-auto"
                              />
                              <div className="mt-3 text-xs font-semibold text-[#6F4E37]/70 bg-[#FAF3E0] px-2 py-1 rounded">
                                SCAN TO PAY
                              </div>
                            </div>
                          ) : (
                            <div className="w-[140px] h-[140px] bg-zinc-100 flex items-center justify-center text-xs text-zinc-400 text-center p-4 rounded">
                              Enter UPI ID to see preview
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AdminShell>
  );
}
