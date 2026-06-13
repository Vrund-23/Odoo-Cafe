import { AdminLayout } from "@/components/layout/admin-layout";
import { useListPaymentMethods, useCreatePaymentMethod, useUpdatePaymentMethod, useDeletePaymentMethod, getListPaymentMethodsQueryKey, PaymentMethodType, PaymentMethodInputType, PaymentMethodUpdateType } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Banknote, CreditCard, QrCode } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { QRCodeSVG } from "qrcode.react";

const pmSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["Cash", "Card", "UPI"]),
  upiId: z.string().optional(),
  active: z.boolean().default(true),
});

type PmFormValues = z.infer<typeof pmSchema>;

export default function AdminPaymentMethods() {
  const { data: methods, isLoading } = useListPaymentMethods();
  const queryClient = useQueryClient();
  const createMethod = useCreatePaymentMethod();
  const updateMethod = useUpdatePaymentMethod();
  const deleteMethod = useDeletePaymentMethod();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const form = useForm<PmFormValues>({
    resolver: zodResolver(pmSchema),
    defaultValues: {
      name: "",
      type: "Cash",
      upiId: "",
      active: true,
    }
  });

  const watchType = form.watch("type");

  const openNewDialog = () => {
    setEditingId(null);
    form.reset({ name: "", type: "Cash", upiId: "", active: true });
    setIsDialogOpen(true);
  };

  const openEditDialog = (method: any) => {
    setEditingId(method.id);
    form.reset({
      name: method.name,
      type: method.type,
      upiId: method.upiId || "",
      active: method.active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this payment method?")) {
      deleteMethod.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPaymentMethodsQueryKey() });
          toast.success("Payment method deleted");
        }
      });
    }
  };

  const handleToggleActive = (id: number, currentActive: boolean) => {
    updateMethod.mutate({ id, data: { active: !currentActive } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPaymentMethodsQueryKey() });
      }
    });
  };

  const onSubmit = (data: PmFormValues) => {
    if (editingId) {
      updateMethod.mutate({ 
        id: editingId, 
        data: { 
          ...data, 
          type: data.type as PaymentMethodUpdateType,
          upiId: data.type === "UPI" ? data.upiId : null
        } 
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPaymentMethodsQueryKey() });
          setIsDialogOpen(false);
          toast.success("Payment method updated");
        }
      });
    } else {
      createMethod.mutate({ 
        data: { 
          ...data, 
          type: data.type as PaymentMethodInputType,
          upiId: data.type === "UPI" ? data.upiId : undefined
        } 
      }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPaymentMethodsQueryKey() });
          setIsDialogOpen(false);
          toast.success("Payment method created");
        }
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case "Cash": return <Banknote className="h-6 w-6" />;
      case "Card": return <CreditCard className="h-6 w-6" />;
      case "UPI": return <QrCode className="h-6 w-6" />;
      default: return <Banknote className="h-6 w-6" />;
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Payment Methods</h1>
            <p className="text-muted-foreground mt-1">Configure how customers can pay for their orders.</p>
          </div>
          <Button onClick={openNewDialog} className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" /> Add Method
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-2"><Skeleton className="h-6 w-32" /></CardHeader>
                <CardContent><Skeleton className="h-10 w-full" /></CardContent>
              </Card>
            ))
          ) : methods?.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground bg-card rounded-xl border border-border">
              No payment methods found. Add one to get started.
            </div>
          ) : (
            methods?.map((method) => (
              <Card key={method.id} className={`overflow-hidden transition-all ${!method.active ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <span className="p-2 rounded-lg bg-primary/10 text-primary">
                      {getTypeIcon(method.type)}
                    </span>
                    {method.name}
                  </CardTitle>
                  <Switch 
                    checked={method.active} 
                    onCheckedChange={() => handleToggleActive(method.id, method.active)}
                  />
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium">{method.type}</span>
                  </div>
                  {method.type === "UPI" && method.upiId && (
                    <div className="mt-4 pt-4 border-t border-border flex flex-col items-center gap-2">
                      <QRCodeSVG value={`upi://pay?pa=${method.upiId}&cu=INR`} size={100} />
                      <span className="text-xs font-mono text-muted-foreground">{method.upiId}</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-muted/20 border-t border-border mt-auto flex justify-between p-4">
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(method)}>Edit</Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(method.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Payment Method" : "New Payment Method"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Method Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Credit Card" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchType === "UPI" && (
                <FormField
                  control={form.control}
                  name="upiId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UPI ID</FormLabel>
                      <FormControl>
                        <Input placeholder="merchant@upi" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMethod.isPending || updateMethod.isPending}>
                  {editingId ? "Save Changes" : "Add Method"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}