import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
import {
  Minus,
  Plus,
  Trash2,
  Send,
  Tag,
  Mail,
  User as UserIcon,
  Printer,
  Coffee,
  Grid3x3,
  Package,
} from "lucide-react";
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

  const navigate = useNavigate();
  const search = useStore((s) => s.searchQuery);

  // Dialogs and popups
  const [showFloor, setShowFloor] = useState(false);
  const [activeCat, setActiveCat] = useState("all");
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [customerOpen, setCustomerOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailVal, setEmailVal] = useState("");
  const [cashReceived, setCashReceived] = useState("");
  const [cardRef, setCardRef] = useState("");
  const [selectedPM, setSelectedPM] = useState(null);
  const [payDone, setPayDone] = useState(false);

  // Numpad Interactive State
  const [selectedLineProductId, setSelectedLineProductId] = useState(null);
  const [numpadMode, setNumpadMode] = useState("qty");
  const [numpadBuffer, setNumpadBuffer] = useState("");

  // Open floor popup if no table
  useEffect(() => {
    if (!currentTableId) setShowFloor(true);
  }, [currentTableId]);

  // Ensure draft order exists for selected table
  useEffect(() => {
    if (!currentTableId) return;
    const existing = orders.find((o) => o.tableId === currentTableId && o.status === "Draft");
    if (existing) {
      setDraftOrder(existing.id);
      if (existing.lines.length > 0) {
        setSelectedLineProductId(existing.lines[0].productId);
      } else {
        setSelectedLineProductId(null);
      }
    } else if (!draftOrderId || orders.find((o) => o.id === draftOrderId)?.status !== "Draft") {
      const newId = createDraftOrder(currentTableId);
      setDraftOrder(newId);
      setSelectedLineProductId(null);
    }
  }, [currentTableId]);

  const order = orders.find((o) => o.id === draftOrderId);
  const customer = customers.find((c) => c.id === order?.customerId);
  const table = useStore.getState().tables.find((t) => t.id === currentTableId);

  // Sync selected line when cart lines change
  useEffect(() => {
    if (order && order.lines.length > 0) {
      if (!selectedLineProductId || !order.lines.some((l) => l.productId === selectedLineProductId)) {
        setSelectedLineProductId(order.lines[0].productId);
      }
    } else {
      setSelectedLineProductId(null);
    }
  }, [order?.lines?.length]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (activeCat !== "all") list = list.filter((p) => p.categoryId === activeCat);
    if (search) list = list.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [products, activeCat, search]);

  const handleSelectTable = (tid) => {
    setCurrentTable(tid);
    setShowFloor(false);
  };

  const handleAdd = (pid) => {
    if (!order) return;
    addLine(order.id, pid);
    updateOrder(order.id, { sentToKitchen: false });
    setSelectedLineProductId(pid);
    setNumpadBuffer("");
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
    let ref;
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

  // Helper to directly update line items in Zustand store
  const updateCartLine = (productId, patch) => {
    if (!order) return;
    const state = useStore.getState();
    const updatedOrders = state.orders.map((o) => {
      if (o.id !== order.id) return o;
      return {
        ...o,
        lines: o.lines.map((l) => {
          if (l.productId !== productId) return l;
          const updatedLine = { ...l };
          if (patch.qty !== undefined) updatedLine.qty = patch.qty;
          if (patch.unitPrice !== undefined) updatedLine.unitPrice = patch.unitPrice;
          
          if (patch.discount !== undefined) {
            if (patch.discount > 0) {
              const amount = (updatedLine.unitPrice * updatedLine.qty * patch.discount) / 100;
              updatedLine.productDiscount = {
                label: `${patch.discount}% custom`,
                amount: amount,
              };
            } else {
              updatedLine.productDiscount = undefined;
            }
          }
          return updatedLine;
        }),
      };
    });
    useStore.setState({ orders: updatedOrders });
    state.recalcOrder(order.id);
    updateOrder(order.id, { sentToKitchen: false });
  };

  // Numpad Key Action
  const handleNumpadKey = (key) => {
    if (selectedLineProductId && order) {
      let buffer = numpadBuffer;
      const targetLine = order.lines.find((l) => l.productId === selectedLineProductId);
      if (!targetLine) return;

      if (key === "⌫") {
        buffer = buffer.slice(0, -1);
        if (buffer === "") buffer = "0";
      } else if (key === "+/-") {
        if (buffer.startsWith("-")) buffer = buffer.slice(1);
        else if (buffer !== "0" && buffer !== "") buffer = "-" + buffer;
      } else {
        if (buffer === "0" || buffer === "") {
          buffer = key;
        } else {
          buffer += key;
        }
      }

      setNumpadBuffer(buffer);
      const numericVal = parseFloat(buffer) || 0;

      if (numpadMode === "qty") {
        const finalQty = Math.max(0, numericVal);
        if (finalQty === 0) {
          setLineQty(order.id, selectedLineProductId, 0);
          setSelectedLineProductId(null);
        } else {
          updateCartLine(selectedLineProductId, { qty: finalQty });
        }
      } else if (numpadMode === "disc") {
        updateCartLine(selectedLineProductId, { discount: Math.min(100, Math.max(0, numericVal)) });
      } else if (numpadMode === "price") {
        updateCartLine(selectedLineProductId, { unitPrice: Math.max(0, numericVal) });
      }
    } else {
      if (selectedPMObj?.type === "Cash") {
        let val = cashReceived;
        if (key === "⌫") {
          val = val.slice(0, -1);
        } else if (key === "+/-") {
          // N/A for cash input
        } else {
          val += key;
        }
        setCashReceived(val);
      }
    }
  };

  const selectMode = (mode) => {
    setNumpadMode(mode);
    setNumpadBuffer("");
  };

  if (!order) {
    return (
      <div className="h-[calc(100vh-4rem)] bg-[#FAF3E0] text-[#2B2118] flex flex-col justify-center items-center select-none">
        <FloorPopup open={showFloor} onSelect={handleSelectTable} onOpenChange={setShowFloor} />
        <Coffee className="w-16 h-16 text-[#6F4E37] mb-4 animate-bounce" />
        <h2 className="text-xl font-extrabold mb-2">Welcome to Odoo Cafe POS</h2>
        <p className="text-sm text-[#6F4E37]/60 mb-6">Select a dining table to launch a sales session.</p>
        <Button onClick={() => setShowFloor(true)} className="bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white cursor-pointer px-6 py-2 rounded-xl font-bold shadow-md shadow-[#6F4E37]/25">
          <Grid3x3 className="w-4 h-4 mr-2" /> Select Table
        </Button>
      </div>
    );
  }

  const selectedPMObj = paymentMethods.find((p) => p.id === selectedPM);
  const change = parseFloat(cashReceived || "0") - order.total;

  return (
    <div className="grid grid-cols-12 gap-3.5 p-3.5 h-[calc(100vh-4rem)] bg-[#FAF3E0] text-[#2B2118] overflow-hidden select-none">
      <FloorPopup open={showFloor} onSelect={handleSelectTable} onOpenChange={setShowFloor} />

      {/* COLUMN 1: PRODUCT SELECTION & SIDEBAR */}
      <div className="col-span-6 flex overflow-hidden border border-[#6F4E37]/20 bg-white rounded-3xl shadow-md p-3">
        {/* Vertical Categories Sidebar */}
        <div className="w-[105px] border-r border-[#6F4E37]/20 bg-white py-1 px-1.5 flex flex-col gap-2.5 overflow-y-auto scrollbar-none shrink-0 pr-3">
          <button
            onClick={() => setActiveCat("all")}
            className={`py-3 px-1 rounded-2xl text-center flex flex-col items-center justify-center gap-1.5 transition border cursor-pointer select-none ${
              activeCat === "all"
                ? "bg-[#6F4E37] text-white border-[#6F4E37] shadow-md shadow-[#6F4E37]/15"
                : "border-[#6F4E37]/30 text-[#6F4E37] hover:bg-[#6F4E37]/10"
            }`}
          >
            <span className="text-[10px] tracking-wider font-extrabold uppercase">All Items</span>
          </button>
          {categories.map((c) => {
            const isActive = activeCat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className="py-3 px-1 rounded-2xl text-center flex flex-col items-center justify-center gap-1.5 transition border cursor-pointer select-none"
                style={
                  isActive
                    ? { background: c.color, color: "white", borderColor: c.color }
                    : { color: c.color, borderColor: `${c.color}50` }
                }
              >
                <span className="text-[10px] tracking-wider font-extrabold uppercase truncate max-w-full px-0.5">
                  {c.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Grid of Products */}
        <div className="flex-1 p-3 overflow-y-auto min-h-0 pl-4 pr-1">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3.5">
              {filteredProducts.map((p) => {
                const cat = categories.find((c) => c.id === p.categoryId);
                return (
                  <button
                    key={p.id}
                    onClick={() => handleAdd(p.id)}
                    className="group relative rounded-2xl bg-[#FAF3E0]/30 hover:bg-[#FAF3E0]/70 border border-[#6F4E37]/20 hover:border-[#6F4E37]/55 p-4 text-left transition-all duration-300 hover:-translate-y-0.5 shadow-sm hover:shadow-lg cursor-pointer flex flex-col justify-between h-[105px] select-none"
                  >
                    <div className="w-full flex items-start justify-between">
                      <div className="font-bold text-[#2B2118] group-hover:text-[#6F4E37] text-xs leading-snug line-clamp-2 max-w-[85%]">
                        {p.name}
                      </div>
                      {cat && (
                        <div
                          className="w-2.5 h-2.5 rounded-full border border-white shadow-sm shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                      )}
                    </div>
                    <div className="text-[#6F4E37] font-extrabold text-sm tracking-tight">
                      ₹{p.price.toLocaleString()}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-zinc-500">
              <Package className="w-10 h-10 mb-2 stroke-[1.5]" />
              <span className="text-sm font-semibold">No products found in this category</span>
            </div>
          )}
        </div>
      </div>

      {/* COLUMN 2: CART / ORDER PANEL */}
      <div className="col-span-3 flex flex-col bg-white border border-[#6F4E37]/25 p-3.5 rounded-3xl overflow-hidden shadow-md justify-between">
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Cart Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-[#6F4E37]/20 shrink-0">
            <div>
              <div className="text-sm font-extrabold text-[#2B2118]">Order #{order.number}</div>
              {customer && (
                <div className="text-[11px] text-[#6F4E37] mt-0.5 font-bold">
                  Cust: {customer.name}
                </div>
              )}
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2 min-h-0 pr-1">
            {order.lines.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs py-12">
                <Package className="w-8 h-8 mb-2 stroke-[1.5]" />
                <span>Tap products to add items</span>
              </div>
            ) : (
              order.lines.map((l) => {
                const p = products.find((x) => x.id === l.productId);
                if (!p) return null;
                const isSelected = selectedLineProductId === l.productId;

                return (
                  <div
                    key={l.productId}
                    onClick={() => {
                      setSelectedLineProductId(l.productId);
                      setNumpadBuffer("");
                    }}
                    className={`group border rounded-2xl p-3 transition cursor-pointer flex flex-col gap-2 ${
                      isSelected
                        ? "border-[#6F4E37] bg-[#6F4E37]/10 shadow-sm"
                        : "border-[#6F4E37]/15 bg-[#FAF3E0]/20 hover:border-[#6F4E37]/30 hover:bg-[#FAF3E0]/40"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className={`font-semibold text-sm transition ${isSelected ? "text-[#6F4E37]" : "text-[#2B2118]"}`}>
                          {p.name}
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-0.5">₹{l.unitPrice} each</div>
                      </div>
                      <div className="font-extrabold text-sm text-[#2B2118]">
                        ₹{(l.qty * l.unitPrice).toFixed(0)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5">
                        <button
                          className="h-6 w-6 rounded-lg bg-[#FAF3E0] hover:bg-[#6F4E37]/20 text-[#6F4E37] flex items-center justify-center transition border border-[#6F4E37]/25 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLineQty(order.id, l.productId, l.qty - 1);
                            updateOrder(order.id, { sentToKitchen: false });
                          }}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-extrabold text-xs w-6 text-[#2B2118] text-center">{l.qty}</span>
                        <button
                          className="h-6 w-6 rounded-lg bg-[#FAF3E0] hover:bg-[#6F4E37]/20 text-[#6F4E37] flex items-center justify-center transition border border-[#6F4E37]/25 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLineQty(order.id, l.productId, l.qty + 1);
                            updateOrder(order.id, { sentToKitchen: false });
                          }}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Trash Delete */}
                      <button
                        className="h-6 w-6 rounded-lg hover:bg-red-500/10 text-zinc-500 hover:text-red-400 flex items-center justify-center transition cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLineQty(order.id, l.productId, 0);
                          updateOrder(order.id, { sentToKitchen: false });
                          if (selectedLineProductId === l.productId) setSelectedLineProductId(null);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {l.productDiscount && (
                      <div className="text-[10px] bg-[#6F4E37]/10 text-[#6F4E37] px-2.5 py-0.5 rounded-md self-start border border-[#6F4E37]/20 font-bold">
                        {l.productDiscount.label}: -₹{l.productDiscount.amount.toFixed(0)}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Kitchen, Totals, Actions */}
        <div className="space-y-3 shrink-0 pt-2.5 border-t border-[#6F4E37]/10">
          {order.sentToKitchen ? (
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-xs font-extrabold px-3 py-2.5 rounded-xl flex items-center justify-center gap-1 w-full select-none">
              ✓ Sent to Kitchen
            </span>
          ) : (
            <button
              onClick={() => {
                if (order.lines.length === 0) {
                  toast.error("Cart is empty");
                  return;
                }
                sendOrderToKitchen(order.id);
                toast.success("Order sent to kitchen successfully!");
              }}
              className="bg-[#6F4E37]/10 text-[#6F4E37] hover:bg-[#6F4E37] hover:text-white border border-[#6F4E37]/25 text-xs font-extrabold px-3 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer w-full"
            >
              <Send className="w-3.5 h-3.5" />
              Send to Kitchen
            </button>
          )}

          {/* Quick action buttons row */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => setCustomerOpen(true)}
              className="bg-[#FAF3E0] hover:bg-[#2C2E38] text-[#6F4E37]/80 text-[11px] font-bold py-2 px-1 rounded-xl transition border border-[#6F4E37]/25 flex items-center justify-center gap-1 cursor-pointer"
            >
              <UserIcon className="w-3.5 h-3.5 text-[#6F4E37]" />
              Customer
            </button>
            <button
              onClick={() => setCouponOpen(true)}
              className="bg-[#FAF3E0] hover:bg-[#2C2E38] text-[#6F4E37]/80 text-[11px] font-bold py-2 px-1 rounded-xl transition border border-[#6F4E37]/25 flex items-center justify-center gap-1 cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-[#6F4E37]" />
              Discount
            </button>
            <button
              onClick={() => setEmailOpen(true)}
              className="bg-[#FAF3E0] hover:bg-[#2C2E38] text-[#6F4E37]/80 text-[11px] font-bold py-2 px-1 rounded-xl transition border border-[#6F4E37]/25 flex items-center justify-center gap-1 cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 text-[#6F4E37]" />
              Send
            </button>
          </div>

          {/* Totals */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-[#6F4E37]/60 font-medium">
              <span>Sub total</span>
              <span className="font-bold text-[#2B2118]">₹{order.subtotal.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-[#6F4E37]/60 font-medium">
              <span>Tax (GST 5%)</span>
              <span className="font-bold text-[#2B2118]">₹{order.tax.toFixed(0)}</span>
            </div>
            {order.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Discount {order.discountLabel ? `(${order.discountLabel})` : ""}</span>
                <span>-₹{order.discountTotal.toFixed(0)}</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-sm pt-2 border-t border-[#6F4E37]/10 text-[#2B2118]">
              <span>Total</span>
              <span className="text-[#6F4E37] text-base">₹{order.total.toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* COLUMN 3: PAYMENT METHOD & NUMPAD PANEL */}
      <div className="col-span-3 flex flex-col bg-white border border-[#6F4E37]/25 rounded-3xl p-3.5 shadow-md justify-between h-full overflow-hidden">
        {/* Payment selector */}
        <div className="space-y-3 shrink-0">
          <h3 className="font-extrabold text-xs text-[#6F4E37]/60 uppercase tracking-wider">Payment</h3>
          <div className="flex flex-col gap-2">
            {paymentMethods
              .filter((p) => p.active)
              .map((p) => {
                const isActive = selectedPM === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPM(p.id)}
                    className={`w-full p-3 border rounded-xl text-left text-xs flex items-center justify-between transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "border-[#6F4E37] bg-[#6F4E37] text-white shadow-md shadow-[#6F4E37]/15 font-bold"
                        : "border-[#6F4E37]/20 bg-[#FAF3E0]/30 text-[#6F4E37]/80 hover:bg-[#FAF3E0]/50 font-medium"
                    }`}
                  >
                    <span>{p.name}</span>
                    <span className="text-[9px] tracking-wide font-extrabold uppercase px-1.5 py-0.5 bg-[#FAF3E0] rounded border border-[#6F4E37]/20 text-[#6F4E37]">
                      {p.type}
                    </span>
                  </button>
                );
              })}
          </div>

          {/* QR or Inputs */}
          {selectedPM && (
            <div className="border-t border-[#6F4E37]/10 pt-3 space-y-2.5">
              {selectedPMObj?.type === "Cash" && (
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider font-extrabold text-[#6F4E37]/60">Amount Received</Label>
                  <Input
                    type="number"
                    placeholder="Enter cash amount"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/20 h-9 rounded-xl focus:border-[#6F4E37] focus:bg-white"
                  />
                  {cashReceived && change >= 0 && (
                    <div className="text-xs text-[#6F4E37]/80 flex justify-between items-center bg-[#FAF3E0]/50 px-2.5 py-1 rounded-lg border border-[#6F4E37]/10">
                      <span>Change due:</span>
                      <span className="font-extrabold text-[#6F4E37]">₹{change.toFixed(0)}</span>
                    </div>
                  )}
                </div>
              )}

              {selectedPMObj?.type === "Card" && (
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider font-extrabold text-[#6F4E37]/60">Transaction Ref</Label>
                  <Input
                    placeholder="Reference..."
                    value={cardRef}
                    onChange={(e) => setCardRef(e.target.value)}
                    className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/20 h-9 rounded-xl focus:border-[#6F4E37] focus:bg-white"
                  />
                </div>
              )}

              {selectedPMObj?.type === "UPI" && selectedPMObj.upiId && (
                <div className="flex flex-col items-center bg-[#FAF3E0]/35 p-2.5 rounded-xl border border-[#6F4E37]/10">
                  <QRCodeCanvas
                    value={`upi://pay?pa=${selectedPMObj.upiId}&am=${order.total}&cu=INR`}
                    size={105}
                    bgColor="#FAF3E0"
                    fgColor="#6F4E37"
                    includeMargin={false}
                  />
                  <div className="text-[10px] font-extrabold text-[#6F4E37] mt-2">{selectedPMObj.upiId}</div>
                </div>
              )}
            </div>
          )}

          {/* Confirm Button / Receipt */}
          <div className="pt-1">
            {!payDone ? (
              <button
                onClick={doPay}
                disabled={!selectedPM || order.total === 0}
                className="w-full bg-[#6F4E37] hover:bg-[#6F4E37]/90 disabled:bg-[#FAF3E0] disabled:text-zinc-500 disabled:border-[#6F4E37]/10 text-white font-extrabold py-3 rounded-xl text-xs uppercase tracking-wider transition-all duration-200 shadow-md shadow-[#C85D40]/10 cursor-pointer border border-[#6F4E37]/20"
              >
                Confirm Payment
              </button>
            ) : (
              <div className="space-y-2">
                <div className="text-center text-emerald-400 font-extrabold text-sm flex items-center justify-center gap-1">
                  ✓ Paid successfully
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 bg-[#FAF3E0] hover:bg-[#6F4E37]/20 text-[#6F4E37] font-bold py-2.5 px-3 rounded-xl text-xs transition border border-[#6F4E37]/25 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print
                  </button>
                  <button
                    onClick={reset}
                    className="flex-1 bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition shadow-md shadow-[#6F4E37]/15 cursor-pointer"
                  >
                    New Order
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* NUMPAD COMPONENT PANEL */}
        <div className="bg-[#FAF3E0]/40 rounded-2xl border border-[#6F4E37]/20 p-2.5 flex flex-col justify-between min-h-[220px]">
          {/* Active Item Edit Indicator */}
          <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-extrabold flex items-center justify-between pb-1.5 border-b border-[#6F4E37]/10 mb-1.5">
            <span>Numpad Mode</span>
            {selectedLineProductId ? (
              <span className="text-[#6F4E37] font-bold normal-case">
                Editing: {products.find(p => p.id === selectedLineProductId)?.name}
              </span>
            ) : (
              <span className="text-zinc-500 normal-case">
                {selectedPMObj?.type === "Cash" ? "Cash Keyboard Mode" : "Select item"}
              </span>
            )}
          </div>

          <div className="flex gap-2 flex-1 min-h-0">
            {/* Number grid */}
            <div className="flex-[4] grid grid-cols-3 gap-1.5">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "+/-", "0", "⌫"].map((key) => (
                <button
                  key={key}
                  onClick={() => handleNumpadKey(key)}
                  className={`font-extrabold text-sm rounded-lg py-2 border transition cursor-pointer flex items-center justify-center outline-none select-none ${
                    key === "⌫"
                      ? "bg-[#C63D2F] hover:bg-[#C63D2F]/90 active:bg-red-700 text-white border-[#C63D2F]/30"
                      : "bg-[#FAF3E0] hover:bg-[#6F4E37]/20 hover:text-[#6F4E37] active:bg-[#6F4E37]/30 text-[#2B2118] border-[#6F4E37]/20 hover:border-[#6F4E37]/40"
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>

            {/* Edit Modes */}
            <div className="flex-1 flex flex-col gap-1.5">
              <button
                onClick={() => selectMode("price")}
                className={`flex-1 rounded-lg text-[10px] font-extrabold transition flex flex-col items-center justify-center border cursor-pointer outline-none select-none ${
                  numpadMode === "price"
                    ? "bg-[#6F4E37] text-white border-[#6F4E37] shadow-sm"
                    : "bg-[#FAF3E0] hover:bg-[#2C2E38] text-[#6F4E37]/60 border-[#6F4E37]/20"
                }`}
              >
                <span>Prices</span>
              </button>
              <button
                onClick={() => selectMode("disc")}
                className={`flex-1 rounded-lg text-[10px] font-extrabold transition flex flex-col items-center justify-center border cursor-pointer outline-none select-none ${
                  numpadMode === "disc"
                    ? "bg-[#6F4E37] text-white border-[#6F4E37] shadow-sm"
                    : "bg-[#FAF3E0] hover:bg-[#2C2E38] text-[#6F4E37]/60 border-[#6F4E37]/20"
                }`}
              >
                <span>Disc.</span>
              </button>
              <button
                onClick={() => selectMode("qty")}
                className={`flex-1 rounded-lg text-[10px] font-extrabold transition flex flex-col items-center justify-center border cursor-pointer outline-none select-none ${
                  numpadMode === "qty"
                    ? "bg-[#6F4E37] text-white border-[#6F4E37] shadow-sm"
                    : "bg-[#FAF3E0] hover:bg-[#2C2E38] text-[#6F4E37]/60 border-[#6F4E37]/20"
                }`}
              >
                <span>Qty</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Coupon dialog */}
      <Dialog open={couponOpen} onOpenChange={setCouponOpen}>
        <DialogContent className="bg-white border border-[#6F4E37]/30 text-[#2B2118] max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#6F4E37] font-bold">Apply Coupon</DialogTitle>
          </DialogHeader>
          <div className="py-2.5">
            <Input
              placeholder="Enter coupon code (e.g. SUMMER20)"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/30 rounded-xl"
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setCouponOpen(false)} className="border-[#6F4E37]/20 text-[#6F4E37]/60 hover:bg-[#FAF3E0] flex-1 cursor-pointer">
              Cancel
            </Button>
            <Button onClick={applyCoupon} className="bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white flex-1 font-bold cursor-pointer">
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer dialog */}
      <Dialog open={customerOpen} onOpenChange={setCustomerOpen}>
        <DialogContent className="bg-white border border-[#6F4E37]/30 text-[#2B2118] max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#6F4E37] font-bold">Assign Customer</DialogTitle>
          </DialogHeader>
          <div className="max-h-72 overflow-y-auto space-y-1.5 py-2">
            {customers.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  updateOrder(order.id, { customerId: c.id });
                  setCustomerOpen(false);
                }}
                className="w-full text-left p-3 hover:bg-[#FAF3E0] border border-transparent hover:border-[#6F4E37]/30 rounded-xl text-sm transition cursor-pointer"
              >
                <div className="font-extrabold text-[#2B2118]">{c.name}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{c.email} • {c.phone}</div>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomerOpen(false)} className="border-[#6F4E37]/20 text-[#6F4E37]/60 hover:bg-[#FAF3E0] w-full font-bold cursor-pointer">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email dialog */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="bg-white border border-[#6F4E37]/30 text-[#2B2118] max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#6F4E37] font-bold">Send Receipt via Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2.5">
            <Label className="text-xs text-[#6F4E37]/60">Email Address</Label>
            <Input
              type="email"
              placeholder="customer@example.com"
              value={emailVal || customer?.email || ""}
              onChange={(e) => setEmailVal(e.target.value)}
              className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/30 rounded-xl"
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setEmailOpen(false)} className="border-[#6F4E37]/20 text-[#6F4E37]/60 hover:bg-[#FAF3E0] flex-1 cursor-pointer">
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast.success("Receipt sent successfully");
                setEmailOpen(false);
              }}
              className="bg-[#6F4E37] hover:bg-[#6F4E37]/90 text-white flex-1 font-bold cursor-pointer"
            >
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
