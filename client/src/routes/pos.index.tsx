import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { FloorPopup } from "@/components/FloorPopup";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Minus, Plus, Search, Trash2, Send, Tag, Mail, User as UserIcon, X, Printer } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

export const Route = createFileRoute("/pos/")({ component: OrderView });

function OrderView() {
  const {
    categories,
    products,
    currentTableId,
    setCurrentTable,
    draftOrderId,
    setDraftOrder,
    orders,
    customers,
    paymentMethods,
    createDraftOrder,
    addLine,
    setLineQty,
    recalcOrder,
    sendOrderToKitchen,
    updateOrder,
    payOrder,
  } = useStore();

  const [showFloor, setShowFloor] = useState(false);
  const [activeCat, setActiveCat] = useState<string | "all">("all");
  const [search, setSearch] = useState("");
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailVal, setEmailVal] = useState("");
  const [cashReceived, setCashReceived] = useState("");
  const [cardRef, setCardRef] = useState("");
  const [selectedPM, setSelectedPM] = useState<string | null>(null);
  const [payDone, setPayDone] = useState(false);

  // Open floor popup if no table
  useEffect(() => {
    if (!currentTableId) setShowFloor(true);
  }, [currentTableId]);

  // Ensure draft order exists for selected table
  useEffect(() => {
    if (!currentTableId) return;
    const existing = orders.find((o) => o.tableId === currentTableId && o.status === "Draft");
    if (existing) setDraftOrder(existing.id);
    else if (!draftOrderId || orders.find((o) => o.id === draftOrderId)?.status !== "Draft") {
      createDraftOrder(currentTableId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTableId]);

  const order = orders.find((o) => o.id === draftOrderId);
  const customer = customers.find((c) => c.id === order?.customerId);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (activeCat !== "all") list = list.filter((p) => p.categoryId === activeCat);
    if (search) list = list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [products, activeCat, search]);

  const handleSelectTable = (tid: string) => {
    setCurrentTable(tid);
    setShowFloor(false);
  };

  const handleAdd = (pid: string) => {
    if (!order) return;
    addLine(order.id, pid);
  };

  const applyCoupon = () => {
    if (!order) return;
    recalcOrder(order.id, couponCode);
    const o = useStore.getState().orders.find((x) => x.id === order.id);
    if (o?.discountLabel?.toUpperCase().includes(couponCode.toUpperCase()))
      toast.success("Coupon applied");
    else toast.error("Invalid coupon");
    setCouponOpen(false);
    setCouponCode("");
  };

  const doPay = () => {
    if (!order || !selectedPM) return toast.error("Select payment method");
    const pm = paymentMethods.find((p) => p.id === selectedPM);
    if (!pm) return;
    let amount = order.total;
    let ref: string | undefined;
    if (pm.type === "Cash") {
      const v = parseFloat(cashReceived);
      if (!v || v < order.total) return toast.error("Insufficient cash");
      amount = v;
    } else if (pm.type === "Card") {
      if (!cardRef) return toast.error("Enter transaction reference");
      ref = cardRef;
    }
    payOrder(order.id, selectedPM, amount, ref);
    toast.success("Payment successful");
    setPayDone(true);
  };

  const reset = () => {
    setPayDone(false);
    setSelectedPM(null);
    setCashReceived("");
    setCardRef("");
    setShowFloor(true);
  };

  if (!order) {
    return (
      <>
        <FloorPopup open={showFloor} onSelect={handleSelectTable} onOpenChange={setShowFloor} />
        <div className="p-8 text-center text-muted-foreground">Select a table to start.</div>
      </>
    );
  }

  const selectedPMObj = paymentMethods.find((p) => p.id === selectedPM);
  const change = parseFloat(cashReceived || "0") - order.total;

  return (
    <div className="grid grid-cols-12 gap-3 p-3 h-[calc(100vh-3.5rem)]">
      <FloorPopup open={showFloor} onSelect={handleSelectTable} onOpenChange={setShowFloor} />

      {/* Products */}
      <div className="col-span-6 flex flex-col gap-3 min-h-0">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveCat("all")}
            className={`px-3 py-1.5 rounded text-sm font-medium border ${
              activeCat === "all" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              className={`px-3 py-1.5 rounded text-sm font-medium border transition`}
              style={
                activeCat === c.id
                  ? { background: c.color, color: "white", borderColor: c.color }
                  : { borderColor: c.color, color: c.color }
              }
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-3 lg:grid-cols-4 gap-2 overflow-y-auto pr-1">
          {filteredProducts.map((p) => {
            const cat = categories.find((c) => c.id === p.categoryId);
            return (
              <button
                key={p.id}
                onClick={() => handleAdd(p.id)}
                className="rounded-lg border bg-card p-3 text-left hover:shadow-md hover:-translate-y-0.5 transition"
                style={{ borderTop: `4px solid ${cat?.color ?? "#888"}` }}
              >
                <div className="font-medium text-sm leading-tight">{p.name}</div>
                <div className="text-amber-700 font-bold mt-1">₹{p.price}</div>
              </button>
            );
          })}
          {!filteredProducts.length && (
            <div className="col-span-full text-center text-muted-foreground py-8">
              No products found
            </div>
          )}
        </div>
      </div>

      {/* Cart */}
      <div className="col-span-3 flex flex-col gap-2 min-h-0">
        <Card className="p-3 flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm">
              <div className="font-semibold">Order #{order.number}</div>
              {customer && (
                <div className="text-xs text-muted-foreground">Customer: {customer.name}</div>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={() => sendOrderToKitchen(order.id)}>
              <Send className="w-3 h-3 mr-1" />
              Kitchen
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {order.lines.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-10">
                Tap products to add
              </div>
            )}
            {order.lines.map((l) => {
              const p = products.find((x) => x.id === l.productId);
              if (!p) return null;
              return (
                <div key={l.productId} className="border rounded-md p-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-sm">{p.name}</div>
                      <div className="text-xs text-muted-foreground">₹{l.unitPrice} each</div>
                    </div>
                    <div className="font-bold text-sm">₹{(l.qty * l.unitPrice).toFixed(0)}</div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() => setLineQty(order.id, l.productId, l.qty - 1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="font-medium w-6 text-center">{l.qty}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() => setLineQty(order.id, l.productId, l.qty + 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 ml-auto text-destructive"
                      onClick={() => setLineQty(order.id, l.productId, 0)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  {l.productDiscount && (
                    <div className="mt-1 text-xs bg-yellow-100 text-yellow-900 px-2 py-0.5 rounded inline-block">
                      {l.productDiscount.label}: -₹{l.productDiscount.amount.toFixed(0)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="border-t pt-2 mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tax</span>
              <span>₹{order.tax.toFixed(2)}</span>
            </div>
            {order.discountTotal > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Discount {order.discountLabel ? `(${order.discountLabel})` : ""}</span>
                <span>-₹{order.discountTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1 border-t">
              <span>Total</span>
              <span>₹{order.total.toFixed(2)}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1 mt-2">
            <Button variant="outline" size="sm" onClick={() => setCustomerOpen(true)}>
              <UserIcon className="w-3 h-3 mr-1" /> Customer
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCouponOpen(true)}>
              <Tag className="w-3 h-3 mr-1" /> Discount
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEmailOpen(true)}>
              <Mail className="w-3 h-3 mr-1" /> Send
            </Button>
          </div>
        </Card>
      </div>

      {/* Payment */}
      <div className="col-span-3 flex flex-col gap-2 min-h-0">
        <Card className="p-3 flex-1 flex flex-col">
          <h3 className="font-semibold mb-2">Payment</h3>
          <div className="space-y-2">
            {paymentMethods
              .filter((p) => p.active)
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPM(p.id)}
                  className={`w-full p-2 border rounded text-left text-sm flex items-center justify-between ${
                    selectedPM === p.id ? "border-primary bg-primary/10" : ""
                  }`}
                >
                  <span>{p.name}</span>
                  <span className="text-xs text-muted-foreground">{p.type}</span>
                </button>
              ))}
          </div>

          <div className="mt-3 border-t pt-3 text-sm space-y-2">
            <div>
              <Label className="text-xs">Amount Due</Label>
              <div className="text-2xl font-bold text-amber-700">₹{order.total.toFixed(2)}</div>
            </div>
            {selectedPMObj?.type === "Cash" && (
              <div>
                <Label className="text-xs">Amount Received</Label>
                <Input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                />
                {cashReceived && change >= 0 && (
                  <div className="mt-1 text-sm">
                    Change due: <span className="font-bold">₹{change.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}
            {selectedPMObj?.type === "Card" && (
              <div>
                <Label className="text-xs">Transaction Ref</Label>
                <Input value={cardRef} onChange={(e) => setCardRef(e.target.value)} />
              </div>
            )}
            {selectedPMObj?.type === "UPI" && selectedPMObj.upiId && (
              <div className="flex flex-col items-center bg-muted p-2 rounded">
                <QRCodeCanvas
                  value={`upi://pay?pa=${selectedPMObj.upiId}&am=${order.total}&cu=INR`}
                  size={120}
                />
                <div className="text-xs mt-1">{selectedPMObj.upiId}</div>
              </div>
            )}
            {!payDone ? (
              <Button className="w-full" onClick={doPay} disabled={!selectedPM || order.total === 0}>
                Confirm Payment
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="text-center text-green-700 font-semibold">✓ Paid</div>
                <Button variant="outline" className="w-full" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-1" /> Print Receipt
                </Button>
                <Button className="w-full" onClick={reset}>
                  New Order
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Coupon dialog */}
      <Dialog open={couponOpen} onOpenChange={setCouponOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Coupon</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Enter coupon code (e.g. SUMMER20)"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCouponOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyCoupon}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer dialog */}
      <Dialog open={customerOpen} onOpenChange={setCustomerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Customer</DialogTitle>
          </DialogHeader>
          <div className="max-h-72 overflow-y-auto space-y-1">
            {customers.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  updateOrder(order.id, { customerId: c.id });
                  setCustomerOpen(false);
                }}
                className="w-full text-left p-2 hover:bg-muted rounded text-sm"
              >
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.email}</div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Email dialog */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Receipt via Email</DialogTitle>
          </DialogHeader>
          <Label>Email</Label>
          <Input
            type="email"
            placeholder="customer@example.com"
            value={emailVal || customer?.email || ""}
            onChange={(e) => setEmailVal(e.target.value)}
          />
          <DialogFooter>
            <Button
              onClick={() => {
                toast.success("Receipt sent");
                setEmailOpen(false);
              }}
            >
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
