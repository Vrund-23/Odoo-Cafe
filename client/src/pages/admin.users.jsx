import { useState, useEffect } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Archive, Key, Loader2 } from "lucide-react";
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

function normaliseUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role === "ADMIN" ? "User" : "Employee",
    active: !u.isArchived,
    password: "", // never returned from server
  };
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [pwdFor, setPwdFor] = useState(null);
  const [pwd, setPwd] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/employees`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch users");
      const json = await res.json();
      const data = json.data || json;
      const array = Array.isArray(data) ? data : (data.users ?? []);
      setUsers(array.map(normaliseUser));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startNew = () => {
    setEditing({
      name: "",
      email: "",
      password: "",
      role: "Employee",
      active: true,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!editing?.name || !editing?.email) return toast.error("Name & email required");
    try {
      const isNew = !editing.id;
      const url = isNew ? `${BASE_URL}/auth/register` : `${BASE_URL}/auth/employees/${editing.id}`;
      const method = isNew ? "POST" : "PUT";

      // If new, we might pass password. If existing, we update role/name/email
      const payload = { ...editing };
      if (payload.role === "User") payload.role = "ADMIN";
      else payload.role = "EMPLOYEE";

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save user");
      const json = await res.json();
      const saved = normaliseUser(json.user ?? json.data ?? json);

      setUsers((prev) =>
        isNew ? [...prev, saved] : prev.map((u) => (u.id === saved.id ? saved : u))
      );
      setOpen(false);
      toast.success("Saved");
    } catch (err) {
      toast.error(err.message || "Failed to save user");
    }
  };

  const archive = async (id) => {
    try {
      const u = users.find((x) => x.id === id);
      if (!u) return;
      const res = await fetch(`${BASE_URL}/auth/employees/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ isArchived: u.active }),
      });
      if (!res.ok) throw new Error("Failed to archive user");

      setUsers((prev) =>
        prev.map((x) => (x.id === id ? { ...x, active: !x.active } : x))
      );
      toast.success(u.active ? "Archived" : "Unarchived");
    } catch (err) {
      toast.error(err.message || "Failed to archive user");
    }
  };

  const del = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/auth/employees/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete user");
      
      setUsers((prev) => prev.filter((x) => x.id !== id));
      toast.success("Deleted");
    } catch (err) {
      toast.error(err.message || "Failed to delete user");
    }
  };

  const changePwd = async () => {
    if (!pwdFor || !pwd) return;
    try {
      const res = await fetch(`${BASE_URL}/auth/employees/${pwdFor.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ password: pwd }),
      });
      if (!res.ok) throw new Error("Failed to change password");

      toast.success("Password updated");
      setPwdFor(null);
    } catch (err) {
      toast.error(err.message || "Failed to update password");
    }
  };

  const handleRoleChange = async (u, newRole) => {
    try {
      const res = await fetch(`${BASE_URL}/auth/employees/${u.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ role: newRole === "User" ? "ADMIN" : "EMPLOYEE" }),
      });
      if (!res.ok) throw new Error("Failed to update role");

      setUsers((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, role: newRole } : x))
      );
      toast.success("Role updated");
    } catch (err) {
      toast.error(err.message || "Failed to update role");
    }
  };

  return (
    <AdminShell title="User / Employee">
      <Button 
        onClick={startNew} 
        className="mb-4 bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white font-bold rounded-xl cursor-pointer"
      >
        <Plus className="w-4 h-4 mr-1" /> New User
      </Button>
      <Card className="bg-white border border-[#6F4E37]/25 rounded-3xl overflow-hidden shadow-md text-[#2B2118]">
        {loading ? (
          <div className="flex justify-center p-8 text-[#6F4E37]/60">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#FAF3E0] border-b border-[#6F4E37]/20">
                <tr>
                  <th className="p-3 text-left font-bold text-[#6F4E37]/80">Name</th>
                  <th className="p-3 text-left font-bold text-[#6F4E37]/80">Email</th>
                  <th className="p-3 text-left font-bold text-[#6F4E37]/80">Role</th>
                  <th className="p-3 text-left font-bold text-[#6F4E37]/80">Status</th>
                  <th className="p-3 w-40 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-[#6F4E37]/10 last:border-0 hover:bg-[#FAF3E0]/10 transition duration-150">
                    <td className="p-3 font-semibold text-[#2B2118]">{u.name}</td>
                    <td className="p-3 text-[#6F4E37]/80">{u.email}</td>
                    <td className="p-3">
                      <Select value={u.role} onValueChange={(v) => handleRoleChange(u, v)}>
                        <SelectTrigger className="w-28 bg-[#FAF3E0] border-[#6F4E37]/20 text-[#2B2118] rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-[#6F4E37]/35 text-[#2B2118]">
                          <SelectItem value="User">User</SelectItem>
                          <SelectItem value="Employee">Employee</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3">
                      <Badge 
                        className={`rounded-full px-2 py-0.5 text-xs font-bold border ${
                          u.active 
                            ? "bg-emerald-500/10 border-emerald-500/35 text-emerald-400" 
                            : "bg-zinc-500/10 border-zinc-500/30 text-[#6F4E37]/60"
                        }`}
                      >
                        {u.active ? "Active" : "Archived"}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          title="Change password" 
                          onClick={() => { setPwdFor(u); setPwd(""); }}
                          className="hover:bg-[#6F4E37]/10 text-[#6F4E37]/60 hover:text-[#6F4E37] h-8 w-8 rounded-lg cursor-pointer"
                        >
                          <Key className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          title="Archive" 
                          onClick={() => archive(u.id)}
                          className="hover:bg-[#6F4E37]/10 text-[#6F4E37]/60 hover:text-[#6F4E37] h-8 w-8 rounded-lg cursor-pointer"
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => del(u.id)}
                          className="hover:bg-red-500/10 text-[#6F4E37]/60 hover:text-red-400 h-8 w-8 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-[#6F4E37]/60">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white border border-[#6F4E37]/30 text-[#2B2118] max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#6F4E37] font-extrabold text-lg">
              {editing?.id ? "Edit" : "New"} User
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-2 text-sm text-[#6F4E37]/80">
              <div className="space-y-1">
                <Label className="text-xs text-[#6F4E37]/60">Name</Label>
                <Input 
                  value={editing.name} 
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })} 
                  className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/25 rounded-xl font-semibold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#6F4E37]/60">Email</Label>
                <Input 
                  value={editing.email} 
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })} 
                  className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/25 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#6F4E37]/60">Password</Label>
                <Input 
                  type="password" 
                  value={editing.password} 
                  onChange={(e) => setEditing({ ...editing, password: e.target.value })} 
                  className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/25 rounded-xl"
                  placeholder={editing?.id ? "Leave blank to keep unchanged" : ""}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#6F4E37]/60">Role</Label>
                <Select value={editing.role} onValueChange={(v) => setEditing({ ...editing, role: v })}>
                  <SelectTrigger className="bg-[#FAF3E0] border-[#6F4E37]/25 text-[#2B2118] rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#6F4E37]/35 text-[#2B2118]">
                    <SelectItem value="User">User (Admin)</SelectItem>
                    <SelectItem value="Employee">Employee (Cashier)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="border-[#6F4E37]/20 text-[#6F4E37]/60 hover:bg-[#FAF3E0] flex-1 cursor-pointer rounded-xl"
            >
              Discard
            </Button>
            <Button 
              onClick={save}
              className="bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white flex-1 font-bold cursor-pointer rounded-xl"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pwdFor} onOpenChange={(v) => !v && setPwdFor(null)}>
        <DialogContent className="bg-white border border-[#6F4E37]/30 text-[#2B2118] max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#6F4E37] font-extrabold text-lg">Change password for {pwdFor?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label className="text-xs text-[#6F4E37]/60">New Password</Label>
            <Input 
              type="password" 
              placeholder="New password..." 
              value={pwd} 
              onChange={(e) => setPwd(e.target.value)} 
              className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/25 rounded-xl"
            />
          </div>
          <DialogFooter className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setPwdFor(null)}
              className="border-[#6F4E37]/20 text-[#6F4E37]/60 hover:bg-[#FAF3E0] flex-1 cursor-pointer rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={changePwd}
              className="bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white flex-1 font-bold cursor-pointer rounded-xl"
            >
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
