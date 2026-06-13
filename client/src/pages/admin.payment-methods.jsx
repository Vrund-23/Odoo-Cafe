import { useState, useEffect } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2 } from "lucide-react";
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
    name: p.type,
    type: p.type,
    upiId: p.upiId ?? null,
    active: p.isEnabled,
  };
}

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      const res = await fetch(`${BASE_URL}/payment-methods`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch payment methods");
      const json = await res.json();
      const data = json.data || json;
      setMethods(Array.isArray(data) ? data.map(normalisePayment) : []);
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
        isNew 
          ? prev.map(x => x.id === m.id ? saved : x)
          : prev.map(x => x.id === m.id ? saved : x)
      );
      if (isNew) toast.success("Payment method created");
    } catch (err) {
      toast.error(err.message || "Failed to save payment method");
    }
  };

  const updateLocal = (id, field, value) => {
    setMethods((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const handleBlurOrChange = (m) => {
    save(m);
  };

  const addNew = () => {
    const newId = "pm-" + Math.random().toString(36).slice(2, 6);
    const newMethod = {
      id: newId,
      name: "Cash",
      type: "Cash",
      active: false,
      isNew: true,
    };
    setMethods((prev) => [newMethod, ...prev]);
  };

  const del = async (id, isNew) => {
    if (isNew) {
      setMethods((prev) => prev.filter((m) => m.id !== id));
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/payment-methods/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete payment method");
      
      setMethods((prev) => prev.filter((m) => m.id !== id));
      toast.success("Deleted");
    } catch (err) {
      toast.error(err.message || "Failed to delete payment method");
    }
  };

  return (
    <AdminShell title="Payment Method">
      <Button 
        onClick={addNew} 
        className="mb-4 bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white font-bold rounded-xl cursor-pointer"
      >
        <Plus className="w-4 h-4 mr-1" /> New Payment Method
      </Button>
      
      {loading ? (
        <div className="flex justify-center p-8 text-[#6F4E37]/60">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {methods.map((m) => (
            <Card key={m.id} className="p-5 bg-white border border-[#6F4E37]/25 rounded-3xl shadow-md text-[#2B2118] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-lg">{m.type}</span>
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={() => del(m.id, m.isNew)}
                  className="hover:bg-red-500/10 text-[#6F4E37]/60 hover:text-red-400 h-8 w-8 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-3 text-sm text-[#6F4E37]/80">
                <span>Type:</span>
                <Select
                  value={m.type}
                  onValueChange={(v) => {
                    updateLocal(m.id, "type", v);
                    handleBlurOrChange({ ...m, type: v });
                  }}
                >
                  <SelectTrigger className="w-32 bg-[#FAF3E0] border-[#6F4E37]/20 text-[#2B2118] rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#6F4E37]/35 text-[#2B2118]">
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="UPI">UPI</SelectItem>
                  </SelectContent>
                </Select>
                <span className="ml-auto font-semibold">Active</span>
                <Switch 
                  checked={m.active} 
                  onCheckedChange={(v) => {
                    updateLocal(m.id, "active", v);
                    handleBlurOrChange({ ...m, active: v });
                  }} 
                  className="data-[state=checked]:bg-[#6F4E37]"
                />
              </div>
              {m.type === "UPI" && (
                <div className="space-y-3 pt-2 border-t border-[#6F4E37]/10">
                  <div className="space-y-1">
                    <label className="text-xs text-[#6F4E37]/60 font-semibold">UPI ID</label>
                    <Input
                      value={m.upiId ?? ""}
                      onChange={(e) => updateLocal(m.id, "upiId", e.target.value)}
                      onBlur={() => handleBlurOrChange(m)}
                      placeholder="example@upi"
                      className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/20 focus:border-[#6F4E37] rounded-xl font-semibold"
                    />
                  </div>
                  {m.upiId && (
                    <div className="flex flex-col items-center bg-[#FAF3E0]/50 p-4 rounded-2xl border border-[#6F4E37]/10">
                      <QRCodeCanvas value={`upi://pay?pa=${m.upiId}&cu=INR`} size={120} className="rounded-lg p-1 bg-white" />
                      <div className="text-xs mt-2 text-[#6F4E37]/60 font-semibold">QR Code Preview</div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
          {methods.length === 0 && (
            <div className="col-span-full p-4 text-center text-[#6F4E37]/60 bg-white border border-[#6F4E37]/25 rounded-3xl">
              No payment methods found.
            </div>
          )}
        </div>
      )}
    </AdminShell>
  );
}
