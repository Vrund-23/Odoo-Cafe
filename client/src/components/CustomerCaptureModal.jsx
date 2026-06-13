import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function CustomerCaptureModal({ open, onOpenChange, tableId, onSuccess }) {
  const customers = useStore((s) => s.customers);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-fill from existing customers if phone matches
  const match = useMemo(() => {
    return customers.find(c => c.phone && c.phone === phone);
  }, [phone, customers]);

  // When match is found, we could auto-fill, but let's let the user see it
  const handlePhoneChange = (e) => {
    const val = e.target.value;
    setPhone(val);
    const existing = customers.find(c => c.phone && c.phone === val);
    if (existing) {
      setName(existing.name || "");
      setEmail(existing.email || "");
    }
  };

  const getAuthHeaders = () => {
    const headers = { "Content-Type": "application/json" };
    try {
      const raw = localStorage.getItem("cafe-auth-token");
      const token = raw ? raw.replace(/^"|"$/g, "") : null;
      if (token) headers["Authorization"] = `Bearer ${token}`;
    } catch (e) {}
    return headers;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim()) {
      return toast.error("Please fill in all details");
    }

    setLoading(true);
    try {
      let savedCustomer;
      const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

      if (match) {
        // Update existing
        const res = await fetch(`${BASE_URL}/customers/${match.id}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({ name, phone, email }),
        });
        if (!res.ok) throw new Error("Failed to update customer");
        const json = await res.json();
        savedCustomer = json.data || json;
        
        // Update local store
        useStore.setState(s => ({
          customers: s.customers.map(c => c.id === savedCustomer.id ? savedCustomer : c)
        }));
      } else {
        // Create new
        const res = await fetch(`${BASE_URL}/customers`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ name, phone, email }),
        });
        if (!res.ok) throw new Error("Failed to create customer");
        const json = await res.json();
        savedCustomer = json.data || json;
        
        // Update local store
        useStore.setState(s => ({
          customers: [...s.customers, savedCustomer]
        }));
      }

      toast.success("Customer saved");
      onSuccess(savedCustomer.id);
      
      // Reset state for next time
      setPhone("");
      setName("");
      setEmail("");
    } catch (err) {
      toast.error(err.message || "Failed to save customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border border-[#6F4E37]/20 text-[#2B2118] rounded-3xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#2B2118] font-extrabold text-lg">Customer Details</DialogTitle>
          <p className="text-xs text-[#6F4E37]/60 font-medium">Please enter customer details before starting the order.</p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#6F4E37]">Mobile Number</Label>
            <Input 
              autoFocus
              required
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={handlePhoneChange}
              className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/30 rounded-xl focus:bg-white"
            />
            {match && <span className="text-[10px] text-green-600 font-bold">Existing customer found</span>}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#6F4E37]">Full Name</Label>
            <Input 
              required
              placeholder="Customer Name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/30 rounded-xl focus:bg-white"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-[#6F4E37]">Email Address</Label>
            <Input 
              type="email"
              required
              placeholder="customer@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/30 rounded-xl focus:bg-white"
            />
          </div>
          <DialogFooter className="pt-2">
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white font-bold rounded-xl cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Start Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
