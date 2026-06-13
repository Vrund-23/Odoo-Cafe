import { useState, useEffect } from "react";
import { PosLayout } from "@/components/layout/pos-layout";
import { 
  useListProducts, 
  useListCategories, 
  useCreateOrder, 
  useGetOrder, 
  useUpdateOrder,
  useListPaymentMethods,
  usePayOrder,
  useSendOrderToKitchen,
  useListCustomers,
  useValidateCoupon,
  getGetOrderQueryKey,
  OrderUpdateLinesItem
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Minus, Trash2, CheckCircle2, UserPlus, Tag, Receipt, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { QRCodeSVG as QRCode } from "qrcode.react";

export default function PosOrder() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<number | "all">("all");
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethodId, setPaymentMethodId] = useState<number | null>(null);
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [paymentRef, setPaymentRef] = useState<string>("");
  
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  
  const [isCouponOpen, setIsCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  
  const [orderId, setOrderId] = useState<number | null>(
    localStorage.getItem("pos_order_id") ? parseInt(localStorage.getItem("pos_order_id") as string) : null
  );

  const queryClient = useQueryClient();
  const createOrder = useCreateOrder();
  const updateOrder = useUpdateOrder();
  const payOrder = usePayOrder();
  const sendToKitchen = useSendOrderToKitchen();
  const validateCoupon = useValidateCoupon();

  const { data: products, isLoading: isLoadingProducts } = useListProducts(
    undefined,
    { query: { queryKey: ["products", search, activeCategory !== "all" ? activeCategory : undefined] } }
  );
  
  const filteredProducts = products?.filter(p => {
    if (activeCategory !== "all" && p.categoryId !== activeCategory) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const { data: categories } = useListCategories();
  const { data: paymentMethods } = useListPaymentMethods();
  const { data: customers } = useListCustomers(
    { search: customerSearch },
    { query: { queryKey: ["customers", customerSearch] } }
  );

  // Get current order if we have an ID
  const { data: currentOrder, isLoading: isLoadingOrder } = useGetOrder(
    orderId || 0,
    { query: { enabled: !!orderId, queryKey: getGetOrderQueryKey(orderId || 0) } }
  );

  // Auto-create order if table is selected but no order exists
  useEffect(() => {
    const tableIdStr = localStorage.getItem("pos_table_id");
    const sessionIdStr = localStorage.getItem("pos_session_id");
    
    if (tableIdStr && sessionIdStr && !orderId && !createOrder.isPending) {
      createOrder.mutate({ 
        data: { 
          tableId: parseInt(tableIdStr),
          sessionId: parseInt(sessionIdStr)
        } 
      }, {
        onSuccess: (newOrder) => {
          setOrderId(newOrder.id);
          localStorage.setItem("pos_order_id", newOrder.id.toString());
        }
      });
    }
  }, [orderId, createOrder]);

  const handleAddToCart = (product: any) => {
    if (!orderId || !currentOrder) return;
    
    // Check if product already in cart
    const existingLineIndex = currentOrder.lines.findIndex(l => l.productId === product.id);
    let newLines: OrderUpdateLinesItem[] = [...currentOrder.lines.map(l => ({
      productId: l.productId,
      qty: l.qty,
      unitPrice: l.unitPrice
    }))];

    if (existingLineIndex >= 0) {
      newLines[existingLineIndex].qty += 1;
    } else {
      newLines.push({
        productId: product.id,
        qty: 1,
        unitPrice: product.price
      });
    }

    updateOrder.mutate({ id: orderId, data: { lines: newLines } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
      }
    });
  };

  const updateLineQty = (productId: number, delta: number) => {
    if (!orderId || !currentOrder) return;
    
    const lineIndex = currentOrder.lines.findIndex(l => l.productId === productId);
    if (lineIndex < 0) return;

    let newLines = [...currentOrder.lines.map(l => ({
      productId: l.productId,
      qty: l.qty,
      unitPrice: l.unitPrice
    }))];
    
    newLines[lineIndex].qty += delta;
    
    if (newLines[lineIndex].qty <= 0) {
      newLines = newLines.filter((_, idx) => idx !== lineIndex);
    }

    updateOrder.mutate({ id: orderId, data: { lines: newLines } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
      }
    });
  };

  const removeLine = (productId: number) => {
    if (!orderId || !currentOrder) return;
    
    const newLines = currentOrder.lines
      .filter(l => l.productId !== productId)
      .map(l => ({
        productId: l.productId,
        qty: l.qty,
        unitPrice: l.unitPrice
      }));

    updateOrder.mutate({ id: orderId, data: { lines: newLines } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
      }
    });
  };

  const assignCustomer = (customerId: number) => {
    if (!orderId) return;
    
    updateOrder.mutate({ id: orderId, data: { customerId } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
        setIsCustomerOpen(false);
        toast.success("Customer assigned to order");
      }
    });
  };

  const applyCoupon = () => {
    if (!orderId || !couponCode) return;
    
    validateCoupon.mutate({ data: { code: couponCode } }, {
      onSuccess: (res: any) => {
        // API returns the coupon if valid
        if (res) {
          updateOrder.mutate({ 
            id: orderId, 
            data: { 
              couponCode: res.code,
              discountKind: res.discountKind,
              discountValue: res.discountValue,
              discountLabel: res.name
            } 
          }, {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
              setIsCouponOpen(false);
              setCouponCode("");
              toast.success("Coupon applied");
            }
          });
        }
      },
      onError: () => {
        toast.error("Invalid coupon code");
      }
    });
  };

  const handleSendToKitchen = () => {
    if (!orderId || !currentOrder || currentOrder.lines.length === 0) return;
    
    sendToKitchen.mutate({ id: orderId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
        toast.success("Order sent to kitchen");
      }
    });
  };

  const handlePay = () => {
    if (!orderId || !paymentMethodId || !currentOrder) return;
    
    const selectedMethod = paymentMethods?.find(m => m.id === paymentMethodId);
    if (!selectedMethod) return;

    payOrder.mutate({ 
      id: orderId, 
      data: { 
        paymentMethodId,
        amountPaid: amountReceived ? parseFloat(amountReceived) : currentOrder.total,
        paymentRef: paymentRef || undefined
      } 
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetOrderQueryKey(orderId) });
        toast.success("Order paid successfully");
        setIsPaymentOpen(false);
        
        // Clear order to start a new one next time
        localStorage.removeItem("pos_order_id");
        localStorage.removeItem("pos_table_id"); // maybe keep table? For now clear it to return to table map
        setOrderId(null);
      }
    });
  };

  const activeMethod = paymentMethodId ? paymentMethods?.find(m => m.id === paymentMethodId) : null;
  const changeDue = amountReceived && currentOrder ? Math.max(0, parseFloat(amountReceived) - currentOrder.total) : 0;

  return (
    <PosLayout>
      <div className="flex h-full w-full bg-background overflow-hidden">
        
        {/* LEFT PANEL: Menu Grid */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-border">
          {/* Categories & Search */}
          <div className="p-4 bg-card border-b border-border shadow-sm z-10 shrink-0">
            <div className="relative mb-4 max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search menu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-12 text-lg rounded-full bg-background"
              />
            </div>
            
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex w-max space-x-2 pb-2">
                <Button 
                  variant={activeCategory === "all" ? "default" : "outline"}
                  className="rounded-full px-6"
                  onClick={() => setActiveCategory("all")}
                >
                  All
                </Button>
                {categories?.map(cat => (
                  <Button 
                    key={cat.id}
                    variant={activeCategory === cat.id ? "default" : "outline"}
                    className={cn(
                      "rounded-full px-6 border-2",
                      activeCategory === cat.id ? "" : "bg-card"
                    )}
                    style={activeCategory === cat.id ? { 
                      backgroundColor: cat.color, 
                      borderColor: cat.color,
                      color: '#fff'
                    } : {
                      borderColor: `${cat.color}40`,
                      color: cat.color
                    }}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-4 bg-muted/20">
            {isLoadingProducts ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array(10).fill(0).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-xl" />
                ))}
              </div>
            ) : filteredProducts?.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                No products found
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-20">
                {filteredProducts?.map(product => (
                  <button
                    key={product.id}
                    onClick={() => handleAddToCart(product)}
                    className="relative flex flex-col bg-card border border-border rounded-xl p-3 hover:border-primary/50 hover:shadow-md transition-all text-left group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-0" />
                    
                    <div className="w-full aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center relative overflow-hidden">
                      {/* Product initial as placeholder */}
                      <span className="text-4xl font-bold text-muted-foreground/30 font-serif">
                        {product.name.charAt(0)}
                      </span>
                      {product.categoryColor && (
                        <div 
                          className="absolute top-2 right-2 w-3 h-3 rounded-full shadow-sm" 
                          style={{ backgroundColor: product.categoryColor }}
                        />
                      )}
                    </div>
                    
                    <div className="z-10 relative">
                      <div className="font-medium text-sm leading-tight line-clamp-2 mb-1 text-foreground">
                        {product.name}
                      </div>
                      <div className="font-mono text-primary font-bold">
                        ${product.price.toFixed(2)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Cart */}
        <div className="w-full md:w-[400px] lg:w-[450px] flex flex-col bg-card shrink-0 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-20">
          
          {/* Cart Header */}
          <div className="h-14 border-b border-border flex items-center justify-between px-4 bg-muted/30">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Current Order
              {currentOrder && <span className="text-muted-foreground text-sm font-normal ml-2">#{currentOrder.number.split('-').pop()}</span>}
            </h2>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn("h-8 rounded-full px-3 text-xs", currentOrder?.customerId ? "bg-primary/10 text-primary" : "border border-border")}
              onClick={() => setIsCustomerOpen(true)}
            >
              <UserPlus className="h-3 w-3 mr-1.5" />
              {currentOrder?.customerName || "Add Customer"}
            </Button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-0">
            {isLoadingOrder ? (
              <div className="p-4 space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : !currentOrder || currentOrder.lines.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
                <p className="font-medium text-foreground">Cart is empty</p>
                <p className="text-sm mt-1">Tap items on the left to add them to the order.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {currentOrder.lines.map((line, idx) => (
                  <div key={`${line.productId}-${idx}`} className="p-4 flex gap-3 group hover:bg-muted/30 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{line.productName}</div>
                      <div className="text-xs text-muted-foreground mt-1 font-mono">
                        ${line.unitPrice.toFixed(2)} x {line.qty}
                      </div>
                      {line.productDiscount != null && line.productDiscount > 0 && (
                        <div className="text-xs text-green-600 mt-0.5 flex items-center">
                          <Tag className="h-3 w-3 mr-1" />
                          {line.productDiscountLabel} (-${(line.productDiscount ?? 0).toFixed(2)})
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="font-mono font-bold">
                        ${(line.lineTotal || (line.unitPrice * line.qty)).toFixed(2)}
                      </div>
                      
                      <div className="flex items-center bg-muted rounded-md h-8 shadow-sm border border-border/50">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-destructive rounded-none rounded-l-md"
                          onClick={() => updateLineQty(line.productId, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <div className="w-8 text-center text-sm font-medium">
                          {line.qty}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-primary rounded-none rounded-r-md"
                          onClick={() => updateLineQty(line.productId, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Summary & Actions */}
          <div className="border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
            
            {/* Totals */}
            <div className="p-4 space-y-2 text-sm border-b border-border/50">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-mono">${currentOrder?.subtotal.toFixed(2) || "0.00"}</span>
              </div>
              
              {(currentOrder?.discountTotal || 0) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span className="flex items-center">
                    <Tag className="h-3 w-3 mr-1" /> Discount {currentOrder?.discountLabel ? `(${currentOrder.discountLabel})` : ""}
                  </span>
                  <span className="font-mono">-${currentOrder?.discountTotal.toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span className="font-mono">${currentOrder?.tax.toFixed(2) || "0.00"}</span>
              </div>
              
              <div className="flex justify-between text-xl font-bold pt-2 border-t border-border/50">
                <span>Total</span>
                <span className="font-mono text-primary">${currentOrder?.total.toFixed(2) || "0.00"}</span>
              </div>
            </div>

            {/* Action Bar */}
            <div className="p-4 grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                className="h-12 border-dashed"
                onClick={() => setIsCouponOpen(true)}
                disabled={!currentOrder || currentOrder.lines.length === 0}
              >
                <Tag className="h-4 w-4 mr-2" />
                Discount
              </Button>
              
              <Button 
                variant="secondary" 
                className="h-12"
                onClick={handleSendToKitchen}
                disabled={!currentOrder || currentOrder.lines.length === 0 || currentOrder.sentToKitchen}
              >
                {currentOrder?.sentToKitchen ? (
                  <><CheckCircle2 className="h-4 w-4 mr-2 text-green-600" /> Sent to Kitchen</>
                ) : (
                  "Send to Kitchen"
                )}
              </Button>
              
              <Button 
                className="col-span-2 h-16 text-lg font-bold shadow-lg"
                onClick={() => setIsPaymentOpen(true)}
                disabled={!currentOrder || currentOrder.lines.length === 0}
              >
                Pay ${currentOrder?.total.toFixed(2) || "0.00"}
              </Button>
            </div>
          </div>
        </div>

      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-[800px] h-[80vh] md:h-auto flex flex-col p-0 overflow-hidden">
          <div className="flex h-full flex-col md:flex-row">
            {/* Payment Methods */}
            <div className="w-full md:w-1/2 border-r border-border bg-muted/10 p-6 overflow-y-auto">
              <h2 className="text-xl font-bold mb-6">Select Payment Method</h2>
              
              <div className="space-y-3">
                {paymentMethods?.filter(m => m.active).map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethodId(method.id)}
                    className={cn(
                      "w-full flex items-center p-4 rounded-xl border-2 transition-all text-left",
                      paymentMethodId === method.id 
                        ? "border-primary bg-primary/5 shadow-sm" 
                        : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center mr-4",
                      paymentMethodId === method.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {method.type === "Cash" && <span className="font-bold">$</span>}
                      {method.type === "Card" && <span className="font-bold">CC</span>}
                      {method.type === "UPI" && <span className="font-bold">QR</span>}
                    </div>
                    <div>
                      <div className="font-bold text-lg">{method.name}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">{method.type}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Payment Details */}
            <div className="w-full md:w-1/2 p-6 bg-card flex flex-col">
              <div className="text-center mb-8">
                <div className="text-sm text-muted-foreground mb-1">Amount Due</div>
                <div className="text-5xl font-bold font-mono text-primary">
                  ${currentOrder?.total.toFixed(2)}
                </div>
              </div>

              {activeMethod ? (
                <div className="flex-1 flex flex-col">
                  {activeMethod.type === "Cash" && (
                    <div className="space-y-4">
                      <label className="text-sm font-medium">Amount Received</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-mono text-muted-foreground">$</span>
                        <Input 
                          type="number" 
                          step="0.01" 
                          className="h-16 pl-10 text-2xl font-mono"
                          value={amountReceived}
                          onChange={(e) => setAmountReceived(e.target.value)}
                          placeholder={currentOrder?.total.toFixed(2)}
                          autoFocus
                        />
                      </div>
                      
                      {amountReceived && parseFloat(amountReceived) >= (currentOrder?.total || 0) && (
                        <div className="p-4 bg-green-50 text-green-900 border border-green-200 rounded-xl flex justify-between items-center mt-6">
                          <span className="font-medium">Change Due</span>
                          <span className="text-2xl font-bold font-mono">${changeDue.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {activeMethod.type === "UPI" && activeMethod.upiId && (
                    <div className="flex flex-col items-center justify-center flex-1 space-y-6">
                      <div className="p-4 bg-white rounded-xl shadow-sm border border-border">
                        <QRCode value={`upi://pay?pa=${activeMethod.upiId}&pn=Odoo%20Cafe&am=${currentOrder?.total.toFixed(2)}&cu=INR`} size={200} />
                      </div>
                      <div className="text-center">
                        <p className="font-medium mb-1">Scan to pay with any UPI app</p>
                        <p className="text-xs font-mono text-muted-foreground">{activeMethod.upiId}</p>
                      </div>
                    </div>
                  )}

                  {activeMethod.type === "Card" && (
                    <div className="space-y-4">
                      <label className="text-sm font-medium">Transaction Reference (Optional)</label>
                      <Input 
                        placeholder="e.g. Auth Code or Last 4 digits" 
                        className="h-12"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        autoFocus
                      />
                      <div className="p-6 bg-muted/30 border border-border border-dashed rounded-xl flex items-center justify-center text-muted-foreground h-32 mt-4">
                        Awaiting card terminal...
                      </div>
                    </div>
                  )}

                  <div className="mt-auto pt-6">
                    <Button 
                      className="w-full h-14 text-lg font-bold shadow-md"
                      onClick={handlePay}
                      disabled={payOrder.isPending || (activeMethod.type === "Cash" && amountReceived !== "" && parseFloat(amountReceived) < (currentOrder?.total || 0))}
                    >
                      Confirm Payment
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-center p-8">
                  Select a payment method from the left to continue.
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Customer Dialog */}
      <Dialog open={isCustomerOpen} onOpenChange={setIsCustomerOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Assign Customer</DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <ScrollArea className="h-[300px] border rounded-md">
              {customers?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No customers found. Add them in the Admin section.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {customers?.map(customer => (
                    <button
                      key={customer.id}
                      onClick={() => assignCustomer(customer.id)}
                      className="w-full p-3 text-left hover:bg-muted/50 transition-colors flex flex-col"
                    >
                      <span className="font-medium">{customer.name}</span>
                      <span className="text-xs text-muted-foreground mt-0.5">{customer.phone || customer.email || "No contact info"}</span>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Coupon Dialog */}
      <Dialog open={isCouponOpen} onOpenChange={setIsCouponOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Apply Discount Code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Input 
                placeholder="Enter coupon code" 
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="uppercase font-mono text-center h-12 text-lg"
                autoFocus
              />
            </div>
            <Button 
              className="w-full h-12 font-medium" 
              onClick={applyCoupon}
              disabled={!couponCode || validateCoupon.isPending}
            >
              {validateCoupon.isPending ? "Validating..." : "Apply Coupon"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </PosLayout>
  );
}