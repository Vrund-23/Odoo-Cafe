import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, type Customer } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/pos/customers")({ component: CustomersPage });

function CustomersPage() {
  const customers = useStore((s) => s.customers);
  const upsert = useStore((s) => s.upsertCustomer);
  const del = useStore((s) => s.deleteCustomer);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Customer | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = customers.filter(
    (c) =>
      !q ||
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      c.email.toLowerCase().includes(q.toLowerCase()),
  );

  const startNew = () => {
    setEditing({ id: Math.random().toString(36).slice(2), name: "", email: "", phone: "" });
    setOpen(true);
  };
  const save = () => {
    if (!editing?.name) return toast.error("Name required");
    upsert(editing);
    setOpen(false);
    toast.success("Saved");
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Button onClick={startNew}>
          <Plus className="w-4 h-4 mr-1" /> New
        </Button>
      </div>
      <div className="relative mb-3">
        <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
      </div>
      <Card>
        {filtered.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-3 border-b last:border-0">
            <div>
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-muted-foreground">
                {c.email} · {c.phone}
              </div>
            </div>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => del(c.id)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        {!filtered.length && <div className="p-8 text-center text-muted-foreground">No customers</div>}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing && customers.find((c) => c.id === editing.id) ? "Edit" : "New"} Customer</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Discard
            </Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
