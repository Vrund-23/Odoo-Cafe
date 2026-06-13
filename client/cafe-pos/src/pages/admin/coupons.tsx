import { AdminLayout } from "@/components/layout/admin-layout";
import { useListCoupons, useCreateCoupon, useUpdateCoupon, useDeleteCoupon, getListCouponsQueryKey, CouponInputType, CouponInputDiscountKind, CouponInputApply, useListProducts } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const couponSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["Coupon", "Promotion"]),
  code: z.string().optional(),
  discountKind: z.enum(["percent", "amount"]),
  discountValue: z.coerce.number().min(0.01, "Value must be greater than 0"),
  active: z.boolean().default(true),
  apply: z.enum(["Product", "Order"]).optional(),
  productId: z.coerce.number().optional().nullable(),
  minQty: z.coerce.number().optional().nullable(),
  minOrderAmount: z.coerce.number().optional().nullable(),
  description: z.string().optional(),
});

type CouponFormValues = z.infer<typeof couponSchema>;

export default function AdminCoupons() {
  const { data: coupons, isLoading } = useListCoupons();
  const { data: products } = useListProducts();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      name: "",
      type: "Coupon",
      code: "",
      discountKind: "percent",
      discountValue: 10,
      active: true,
      apply: "Order",
      description: "",
    }
  });

  const watchType = form.watch("type");
  const watchApply = form.watch("apply");

  const openNewDialog = () => {
    setEditingId(null);
    form.reset({
      name: "",
      type: "Coupon",
      code: "",
      discountKind: "percent",
      discountValue: 10,
      active: true,
      apply: "Order",
      description: "",
      productId: null,
      minQty: null,
      minOrderAmount: null,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (coupon: any) => {
    setEditingId(coupon.id);
    form.reset({
      name: coupon.name,
      type: coupon.type,
      code: coupon.code || "",
      discountKind: coupon.discountKind,
      discountValue: coupon.discountValue,
      active: coupon.active,
      apply: coupon.apply || "Order",
      productId: coupon.productId,
      minQty: coupon.minQty,
      minOrderAmount: coupon.minOrderAmount,
      description: coupon.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this coupon/promotion?")) {
      deleteCoupon.mutate({ id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCouponsQueryKey() });
          toast.success("Deleted successfully");
        }
      });
    }
  };

  const handleToggleActive = (id: number, currentActive: boolean) => {
    updateCoupon.mutate({ id, data: { active: !currentActive } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCouponsQueryKey() });
      }
    });
  };

  const onSubmit = (data: CouponFormValues) => {
    // Format payload appropriately
    const payload = {
      ...data,
      type: data.type as CouponInputType,
      discountKind: data.discountKind as CouponInputDiscountKind,
      apply: data.type === "Promotion" ? (data.apply as CouponInputApply) : undefined,
      code: data.type === "Coupon" ? data.code : undefined,
      productId: data.type === "Promotion" && data.apply === "Product" ? data.productId || undefined : undefined,
      minQty: data.type === "Promotion" && data.apply === "Product" ? data.minQty || undefined : undefined,
      minOrderAmount: data.type === "Promotion" && data.apply === "Order" ? data.minOrderAmount || undefined : undefined,
    };

    if (editingId) {
      updateCoupon.mutate({ id: editingId, data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCouponsQueryKey() });
          setIsDialogOpen(false);
          toast.success("Updated successfully");
        }
      });
    } else {
      createCoupon.mutate({ data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListCouponsQueryKey() });
          setIsDialogOpen(false);
          toast.success("Created successfully");
        }
      });
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Coupons & Promotions</h1>
            <p className="text-muted-foreground mt-1">Manage discounts, codes, and automatic promotions.</p>
          </div>
          <Button onClick={openNewDialog} className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" /> Add Discount
          </Button>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Rule / Code</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(4).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : coupons?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No coupons or promotions found.
                    </TableCell>
                  </TableRow>
                ) : (
                  coupons?.map((coupon) => (
                    <TableRow key={coupon.id} className={!coupon.active ? "opacity-60" : ""}>
                      <TableCell className="font-medium">{coupon.name}</TableCell>
                      <TableCell>
                        <Badge variant={coupon.type === "Coupon" ? "default" : "secondary"}>
                          {coupon.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        {coupon.discountKind === "percent" ? `${coupon.discountValue}%` : `$${coupon.discountValue.toFixed(2)}`}
                      </TableCell>
                      <TableCell>
                        {coupon.type === "Coupon" ? (
                          <code className="bg-muted px-2 py-1 rounded text-xs">{coupon.code}</code>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {coupon.apply === "Product" 
                              ? `Buy ${coupon.minQty || 1} ${products?.find(p => p.id === coupon.productId)?.name || 'product'}` 
                              : `Order > $${coupon.minOrderAmount || 0}`}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch 
                          checked={coupon.active} 
                          onCheckedChange={() => handleToggleActive(coupon.id, coupon.active)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => openEditDialog(coupon)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(coupon.id)}>
                            <Trash2 className="h-4 w-4" />
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "New"} {watchType}</DialogTitle>
            <DialogDescription>
              {watchType === "Coupon" ? "Coupons require a code to be entered at checkout." : "Promotions are automatically applied when conditions are met."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange} disabled={!!editingId}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Coupon">Coupon</SelectItem>
                          <SelectItem value="Promotion">Promotion</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Summer Sale" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {watchType === "Coupon" && (
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coupon Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. SUMMER20" className="uppercase font-mono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="discountKind"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percent">Percentage (%)</SelectItem>
                          <SelectItem value="amount">Fixed Amount ($)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discountValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {watchType === "Promotion" && (
                <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                  <h4 className="font-medium text-sm">Promotion Rules</h4>
                  <FormField
                    control={form.control}
                    name="apply"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apply To</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Order">Entire Order</SelectItem>
                            <SelectItem value="Product">Specific Product</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchApply === "Order" ? (
                    <FormField
                      control={form.control}
                      name="minOrderAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Order Amount ($)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="productId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product</FormLabel>
                            <Select 
                              value={field.value ? field.value.toString() : ""} 
                              onValueChange={(val) => field.onChange(parseInt(val))}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {products?.map((p) => (
                                  <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="minQty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Quantity</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              )}

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <p className="text-sm text-muted-foreground">Enable or disable this {watchType.toLowerCase()}</p>
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
                <Button type="submit" disabled={createCoupon.isPending || updateCoupon.isPending}>
                  {editingId ? "Save Changes" : `Create ${watchType}`}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}