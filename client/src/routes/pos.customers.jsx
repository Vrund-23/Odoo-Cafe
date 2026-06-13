import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
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
  const [editing, setEditing] = useState(null);
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
    <div className="p-6 bg-[#FAF3E0] text-[#2B2118] min-h-[calc(100vh-4rem)] max-w-4xl mx-auto space-y-4 select-none">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-extrabold text-[#6F4E37] tracking-tight">Customers</h1>
        <Button onClick={startNew} className="bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white font-bold px-4 py-2 rounded-xl transition border border-[#6F4E37]/20 cursor-pointer">
          <Plus className="w-4 h-4 mr-1" /> New Customer
        </Button>
      </div>

      <div className="relative mb-3">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
        <Input 
          placeholder="Search customers by name or email..." 
          value={q} 
          onChange={(e) => setQ(e.target.value)} 
          className="pl-9 bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/30 focus:border-[#6F4E37] focus:bg-white rounded-xl" 
        />
      </div>

      <Card className="bg-white border border-[#6F4E37]/25 rounded-3xl overflow-hidden shadow-md">
        {filtered.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-4 border-b border-[#6F4E37]/10 last:border-0 hover:bg-[#FAF3E0]/20 transition-all duration-200">
            <div>
              <div className="font-bold text-[#2B2118] text-sm">{c.name}</div>
              <div className="text-xs text-[#6F4E37]/60 mt-1">
                {c.email} • {c.phone}
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => { setEditing(c); setOpen(true); }}
                className="hover:bg-[#6F4E37]/10 text-[#6F4E37]/60 hover:text-[#6F4E37] cursor-pointer h-8 w-8 rounded-lg"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => {
                  del(c.id);
                  toast.success("Customer deleted");
                }}
                className="hover:bg-red-500/10 text-[#6F4E37]/60 hover:text-red-400 cursor-pointer h-8 w-8 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        {!filtered.length && (
          <div className="p-10 text-center text-zinc-500 font-semibold">
            No customers found matching search criteria.
          </div>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white border border-[#6F4E37]/30 text-[#2B2118] max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#6F4E37] font-bold">
              {editing && customers.some((c) => c.id === editing.id) ? "Edit Customer Details" : "New Customer"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label className="text-xs text-[#6F4E37]/60">Full Name</Label>
                <Input 
                  value={editing.name} 
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })} 
                  className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/30 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#6F4E37]/60">Email Address</Label>
                <Input 
                  value={editing.email} 
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })} 
                  className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/30 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#6F4E37]/60">Phone Number</Label>
                <Input 
                  value={editing.phone} 
                  onChange={(e) => setEditing({ ...editing, phone: e.target.value })} 
                  className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/30 rounded-xl"
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="border-[#6F4E37]/20 text-[#6F4E37]/60 hover:bg-[#FAF3E0] flex-1 cursor-pointer"
            >
              Discard
            </Button>
            <Button 
              onClick={save}
              className="bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white flex-1 font-bold cursor-pointer"
            >
              Save Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
