import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

export const Route = createFileRoute("/admin/payment-methods")({ component: PaymentMethodsPage });

function PaymentMethodsPage() {
  const methods = useStore((s) => s.paymentMethods);
  const upsert = useStore((s) => s.upsertPaymentMethod);
  const del = useStore((s) => s.deletePaymentMethod);

  const addNew = () => {
    upsert({
      id: "pm-" + Math.random().toString(36).slice(2, 6),
      name: "New Method",
      type: "Cash",
      active: false,
    });
  };

  return (
    <AdminShell title="Payment Method">
      <Button 
        onClick={addNew} 
        className="mb-4 bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white font-bold rounded-xl cursor-pointer"
      >
        <Plus className="w-4 h-4 mr-1" /> New Payment Method
      </Button>
      <div className="grid md:grid-cols-2 gap-4">
        {methods.map((m) => (
          <Card key={m.id} className="p-5 bg-white border border-[#6F4E37]/25 rounded-3xl shadow-md text-white space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Input
                value={m.name}
                onChange={(e) => upsert({ ...m, name: e.target.value })}
                className="max-w-xs bg-[#FAF3E0] text-white border-[#6F4E37]/20 focus:border-[#6F4E37] rounded-xl font-bold"
              />
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => del(m.id)}
                className="hover:bg-red-500/10 text-[#6F4E37]/60 hover:text-red-400 h-8 w-8 rounded-lg cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#6F4E37]/80">
              <span>Type:</span>
              <Select
                value={m.type}
                onValueChange={(v) => upsert({ ...m, type: v })}
              >
                <SelectTrigger className="w-32 bg-[#FAF3E0] border-[#6F4E37]/20 text-white rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#6F4E37]/35 text-white">
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                </SelectContent>
              </Select>
              <span className="ml-auto font-semibold">Active</span>
              <Switch 
                checked={m.active} 
                onCheckedChange={(v) => upsert({ ...m, active: v })} 
                className="data-[state=checked]:bg-[#6F4E37]"
              />
            </div>
            {m.type === "UPI" && (
              <div className="space-y-3 pt-2 border-t border-[#6F4E37]/10">
                <div className="space-y-1">
                  <label className="text-xs text-[#6F4E37]/60 font-semibold">UPI ID</label>
                  <Input
                    value={m.upiId ?? ""}
                    onChange={(e) => upsert({ ...m, upiId: e.target.value })}
                    placeholder="example@upi"
                    className="bg-[#FAF3E0] text-white border-[#6F4E37]/20 focus:border-[#6F4E37] rounded-xl font-semibold"
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
      </div>
    </AdminShell>
  );
}
