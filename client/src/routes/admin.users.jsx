import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Archive, Key } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({ component: UsersPage });

function UsersPage() {
  const users = useStore((s) => s.users);
  const upsert = useStore((s) => s.upsertUser);
  const del = useStore((s) => s.deleteUser);
  const archive = useStore((s) => s.archiveUser);
  const changePwd = useStore((s) => s.changePassword);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [pwdFor, setPwdFor] = useState(null);
  const [pwd, setPwd] = useState("");

  const startNew = () => {
    setEditing({
      id: "u-" + Math.random().toString(36).slice(2, 6),
      name: "",
      email: "",
      password: "",
      role: "Employee",
      active: true,
    });
    setOpen(true);
  };

  const save = () => {
    if (!editing?.name || !editing?.email) return toast.error("Name & email required");
    upsert(editing);
    setOpen(false);
    toast.success("Saved");
  };

  return (
    <AdminShell title="User / Employee">
      <Button 
        onClick={startNew} 
        className="mb-4 bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white font-bold rounded-xl cursor-pointer"
      >
        <Plus className="w-4 h-4 mr-1" /> New User
      </Button>
      <Card className="bg-white border border-[#6F4E37]/25 rounded-3xl overflow-hidden shadow-md text-white">
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
                  <td className="p-3 font-semibold text-white">{u.name}</td>
                  <td className="p-3 text-[#6F4E37]/80">{u.email}</td>
                  <td className="p-3">
                    <Select value={u.role} onValueChange={(v) => upsert({ ...u, role: v })}>
                      <SelectTrigger className="w-28 bg-[#FAF3E0] border-[#6F4E37]/20 text-white rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#6F4E37]/35 text-white">
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
                        className="hover:bg-[#FAF3E0] text-[#6F4E37]/60 hover:text-white h-8 w-8 rounded-lg cursor-pointer"
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        title="Archive" 
                        onClick={() => archive(u.id)}
                        className="hover:bg-[#FAF3E0] text-[#6F4E37]/60 hover:text-white h-8 w-8 rounded-lg cursor-pointer"
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
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-white border border-[#6F4E37]/30 text-white max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-white font-extrabold text-lg">
              {users.find((u) => u.id === editing?.id) ? "Edit" : "New"} User
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4 py-2 text-sm text-[#6F4E37]/80">
              <div className="space-y-1">
                <Label className="text-xs text-[#6F4E37]/60">Name</Label>
                <Input 
                  value={editing.name} 
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })} 
                  className="bg-[#FAF3E0] text-white border-[#6F4E37]/25 rounded-xl font-semibold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#6F4E37]/60">Email</Label>
                <Input 
                  value={editing.email} 
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })} 
                  className="bg-[#FAF3E0] text-white border-[#6F4E37]/25 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#6F4E37]/60">Password</Label>
                <Input 
                  type="password" 
                  value={editing.password} 
                  onChange={(e) => setEditing({ ...editing, password: e.target.value })} 
                  className="bg-[#FAF3E0] text-white border-[#6F4E37]/25 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-[#6F4E37]/60">Role</Label>
                <Select value={editing.role} onValueChange={(v) => setEditing({ ...editing, role: v })}>
                  <SelectTrigger className="bg-[#FAF3E0] border-[#6F4E37]/25 text-white rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#6F4E37]/35 text-white">
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
        <DialogContent className="bg-white border border-[#6F4E37]/30 text-white max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-white font-extrabold text-lg">Change password for {pwdFor?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label className="text-xs text-[#6F4E37]/60">New Password</Label>
            <Input 
              type="password" 
              placeholder="New password..." 
              value={pwd} 
              onChange={(e) => setPwd(e.target.value)} 
              className="bg-[#FAF3E0] text-white border-[#6F4E37]/25 rounded-xl"
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
              onClick={() => {
                if (pwdFor && pwd) {
                  changePwd(pwdFor.id, pwd);
                  toast.success("Password updated");
                  setPwdFor(null);
                }
              }}
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
