import { AdminLayout } from "@/components/layout/admin-layout";
import { useListUsers, useCreateUser, useArchiveUser, useChangePassword, getListUsersQueryKey, UserInputRole } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Key, Archive, UserCheck, Shield } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const userSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Valid email required"),
  password: z.string().min(6, "Password min 6 chars"),
  role: z.enum(["User", "Employee"]),
});

const passwordSchema = z.object({
  password: z.string().min(6, "Password min 6 chars"),
});

export default function AdminUsers() {
  const { data: users, isLoading } = useListUsers();
  
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isPwdDialogOpen, setIsPwdDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  const createUser = useCreateUser();
  const archiveUser = useArchiveUser();
  const changePassword = useChangePassword();

  const userForm = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: "", email: "", password: "", role: "Employee" }
  });

  const pwdForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "" }
  });

  const openNewDialog = () => {
    userForm.reset();
    setIsNewDialogOpen(true);
  };

  const openPwdDialog = (id: number) => {
    setSelectedUserId(id);
    pwdForm.reset();
    setIsPwdDialogOpen(true);
  };

  const handleCreateUser = (data: z.infer<typeof userSchema>) => {
    createUser.mutate({ data: { ...data, role: data.role as UserInputRole } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
        setIsNewDialogOpen(false);
        toast.success("User created successfully");
      }
    });
  };

  const handleChangePwd = (data: z.infer<typeof passwordSchema>) => {
    if (!selectedUserId) return;
    
    changePassword.mutate({ id: selectedUserId, data }, {
      onSuccess: () => {
        setIsPwdDialogOpen(false);
        toast.success("Password updated successfully");
      }
    });
  };

  const handleArchive = (id: number, currentActive: boolean) => {
    const action = currentActive ? "archive" : "unarchive";
    if (confirm(`Are you sure you want to ${action} this user?`)) {
      archiveUser.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
          toast.success(`User ${action}d successfully`);
        }
      });
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Staff & Users</h1>
            <p className="text-muted-foreground mt-1">Manage employee access and POS logins.</p>
          </div>
          <Button onClick={openNewDialog} className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" /> Add User
          </Button>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : users?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users?.map((u) => (
                    <TableRow key={u.id} className={!u.active ? "opacity-60 bg-muted/20" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{u.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm">
                          {u.role === "User" ? <Shield className="h-3 w-3 mr-1 text-primary" /> : <UserCheck className="h-3 w-3 mr-1 text-muted-foreground" />}
                          {u.role === "User" ? "Admin" : "Employee"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.active ? "outline" : "secondary"} className={u.active ? "text-green-600 border-green-600/30 bg-green-50/50" : ""}>
                          {u.active ? "Active" : "Archived"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openPwdDialog(u.id)}>
                            <Key className="h-4 w-4 mr-1 opacity-70" />
                            Password
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={u.active ? "text-muted-foreground hover:text-amber-600" : "text-muted-foreground hover:text-green-600"} 
                            onClick={() => handleArchive(u.id, u.active)}
                            title={u.active ? "Archive" : "Unarchive"}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* New User Dialog */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new staff account.</DialogDescription>
          </DialogHeader>
          <Form {...userForm}>
            <form onSubmit={userForm.handleSubmit(handleCreateUser)} className="space-y-4 pt-2">
              <FormField
                control={userForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@cafe.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Employee">Employee (POS Access)</SelectItem>
                        <SelectItem value="User">Admin (Full Access)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={userForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsNewDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createUser.isPending}>Create User</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isPwdDialogOpen} onOpenChange={setIsPwdDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Set a new password for this user.</DialogDescription>
          </DialogHeader>
          <Form {...pwdForm}>
            <form onSubmit={pwdForm.handleSubmit(handleChangePwd)} className="space-y-4 pt-2">
              <FormField
                control={pwdForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} autoFocus />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsPwdDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={changePassword.isPending}>Update Password</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}