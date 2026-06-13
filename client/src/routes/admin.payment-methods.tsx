import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { useStore, type PaymentMethod, type PaymentType } from "@/lib/store";
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
      <Button onClick={addNew} className="mb-3">
        <Plus className="w-4 h-4 mr-1" /> New
      </Button>
      <div className="grid md:grid-cols-2 gap-3">
        {methods.map((m) => (
          <Card key={m.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Input
                value={m.name}
                onChange={(e) => upsert({ ...m, name: e.target.value })}
                className="max-w-xs font-semibold"
              />
              <Button size="icon" variant="ghost" onClick={() => del(m.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <span>Type:</span>
              <Select
                value={m.type}
                onValueChange={(v) => upsert({ ...m, type: v as PaymentType })}
              >
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                </SelectContent>
              </Select>
              <span className="ml-auto">Active</span>
              <Switch checked={m.active} onCheckedChange={(v) => upsert({ ...m, active: v })} />
            </div>
            {m.type === "UPI" && (
              <div className="space-y-2">
                <div>
                  <label className="text-sm">UPI ID</label>
                  <Input
                    value={m.upiId ?? ""}
                    onChange={(e) => upsert({ ...m, upiId: e.target.value })}
                    placeholder="cafe@ybl"
                  />
                </div>
                {m.upiId && (
                  <div className="flex flex-col items-center bg-muted p-3 rounded">
                    <QRCodeCanvas value={`upi://pay?pa=${m.upiId}&cu=INR`} size={120} />
                    <div className="text-xs mt-2">QR Preview</div>
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
