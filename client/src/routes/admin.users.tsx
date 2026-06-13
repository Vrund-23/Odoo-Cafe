import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { useStore, type User } from "@/lib/store";
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
  const [editing, setEditing] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [pwdFor, setPwdFor] = useState<User | null>(null);
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
      <Button onClick={startNew} className="mb-3">
        <Plus className="w-4 h-4 mr-1" /> New
      </Button>
      <Card>
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Role</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 w-40"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="p-2">{u.name}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">
                  <Select value={u.role} onValueChange={(v: any) => upsert({ ...u, role: v })}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="User">User</SelectItem>
                      <SelectItem value="Employee">Employee</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-2">
                  <Badge variant={u.active ? "default" : "secondary"}>{u.active ? "Active" : "Archived"}</Badge>
                </td>
                <td className="p-2 flex gap-1 justify-end">
                  <Button size="icon" variant="ghost" title="Change password" onClick={() => { setPwdFor(u); setPwd(""); }}>
                    <Key className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" title="Archive" onClick={() => archive(u.id)}>
                    <Archive className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => del(u.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{users.find((u) => u.id === editing?.id) ? "Edit" : "New"} User</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
              <div><Label>Password</Label><Input type="password" value={editing.password} onChange={(e) => setEditing({ ...editing, password: e.target.value })} /></div>
              <div>
                <Label>Role</Label>
                <Select value={editing.role} onValueChange={(v: any) => setEditing({ ...editing, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="User">User (Admin)</SelectItem>
                    <SelectItem value="Employee">Employee (Cashier)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Discard</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!pwdFor} onOpenChange={(v) => !v && setPwdFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Change password for {pwdFor?.name}</DialogTitle></DialogHeader>
          <Input type="password" placeholder="New password" value={pwd} onChange={(e) => setPwd(e.target.value)} />
          <DialogFooter>
            <Button
              onClick={() => {
                if (pwdFor && pwd) {
                  changePwd(pwdFor.id, pwd);
                  toast.success("Password updated");
                  setPwdFor(null);
                }
              }}
            >
              Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
