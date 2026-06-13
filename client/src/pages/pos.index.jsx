import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { FloorPopup } from "@/components/FloorPopup";
import { CustomerCaptureModal } from "@/components/CustomerCaptureModal";
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

export default function OrderView() {
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
    }
  }, [currentTableId, orders]);

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

  const [captureOpen, setCaptureOpen] = useState(false);
  const [pendingTable, setPendingTable] = useState(null);

  const handleSelectTable = (tid) => {
    const isOccupied = useStore.getState().orders.some(o => o.tableId === tid && o.status === "Draft");
    if (!isOccupied) {
      setPendingTable(tid);
      setCaptureOpen(true);
      setShowFloor(false);
    } else {
      setCurrentTable(tid);
      setShowFloor(false);
    }
  };

  const handleCustomerCaptured = (customerId) => {
    setCaptureOpen(false);
    const newId = createDraftOrder(pendingTable, customerId);
    setDraftOrder(newId);
    setCurrentTable(pendingTable);
    setSelectedLineProductId(null);
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

  const doPay = async () => {
    if (!order || !selectedPM) return toast.error("Select payment method");
    const pm = paymentMethods.find((p) => p.id === selectedPM);
    if (!pm) return;
    let amount = order.total;
    let ref;

    if (pm.type.toUpperCase() === "CASH") {
      const v = parseFloat(cashReceived);
      const roundedTotal = Math.round(order.total);
      if (!v || v < roundedTotal) return toast.error("Insufficient cash");
      amount = v;
      payOrder(order.id, selectedPM, amount, ref);
      toast.success("Payment successful");
      setPayDone(true);
    } else if (pm.type.toUpperCase() === "CARD" || pm.type.toUpperCase() === "UPI") {
      // Trigger Razorpay Flow for both Card and UPI (QR)
      try {
        toast.loading("Initializing payment...", { id: "rzp-init" });
        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/payment/razorpay/order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${useStore.getState().authToken}`
          },
          body: JSON.stringify({ amount: order.total, receipt: `order_${order.id}` })
        });
        const json = await res.json();
        toast.dismiss("rzp-init");

        if (!res.ok) throw new Error(json.message || "Failed to initialize payment");

        const rzpOrder = json.data.order;

        // If the user selected UPI specifically, we can ask Razorpay to prioritize it
        const isUPI = pm.type.toUpperCase() === "UPI";

        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_T1D3g5Y4TUxnUO",
          amount: rzpOrder.amount,
          currency: "INR",
          name: "Odoo Cafe",
          description: `Payment for Order #${order.number}`,
          order_id: rzpOrder.id,
          handler: async function (response) {
            try {
              toast.loading("Verifying payment...", { id: "rzp-verify" });
              const verifyRes = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/payment/razorpay/verify`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${useStore.getState().authToken}`
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                })
              });
              const verifyJson = await verifyRes.json();
              toast.dismiss("rzp-verify");

              if (!verifyRes.ok) throw new Error(verifyJson.message || "Payment verification failed");

              payOrder(order.id, selectedPM, amount, response.razorpay_payment_id);
              toast.success("Payment successful");
              setPayDone(true);
            } catch (err) {
              toast.dismiss("rzp-verify");
              toast.error(err.message);
            }
          },
          prefill: {
            name: "Customer",
            email: "test@cafe.com",
            contact: "9999999999"
          },
          theme: {
            color: "#6F4E37"
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (response) {
          toast.error(`Payment Failed: ${response.error.description}`);
        });
        rzp.open();

      } catch (err) {
        toast.dismiss("rzp-init");
        toast.error(err.message);
      }
    } else {
      // UPI or other
      payOrder(order.id, selectedPM, amount, ref);
      toast.success("Payment successful");
      setPayDone(true);
    }
  };

  const reset = () => {
    setPayDone(false);
    setSelectedPM(null);
    setCashReceived("");
    setCardRef("");
    setCurrentTable(null);
    setDraftOrder(null);
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
        <CustomerCaptureModal open={captureOpen} onOpenChange={setCaptureOpen} tableId={pendingTable} onSuccess={handleCustomerCaptured} />
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
  const roundedTotal = Math.round(order.total);
  const change = parseFloat(cashReceived || "0") - roundedTotal;

  return (
    <div className="grid grid-cols-12 gap-4 p-4 h-[calc(100vh-4rem)] bg-transparent text-[#6F4E37] overflow-hidden select-none">
      <FloorPopup open={showFloor} onSelect={handleSelectTable} onOpenChange={setShowFloor} />
      <CustomerCaptureModal open={captureOpen} onOpenChange={setCaptureOpen} tableId={pendingTable} onSuccess={handleCustomerCaptured} />

      {/* COLUMN 1: PRODUCT SELECTION & SIDEBAR */}
      <div className="col-span-6 flex overflow-hidden border border-[#6F4E37]/30 bg-white rounded-xl shadow-sm p-3">
        {/* Vertical Categories Sidebar */}
        <div className="w-[105px] border-r border-[#6F4E37]/20 bg-white py-1 flex flex-col gap-2 overflow-y-auto scrollbar-none shrink-0 pr-3">
          <button
            onClick={() => setActiveCat("all")}
            className={`py-3 px-2 rounded-lg text-center flex flex-col items-center justify-center gap-1.5 transition-all border cursor-pointer select-none ${
              activeCat === "all"
                ? "bg-[#6F4E37] text-white border-[#6F4E37]/50 shadow-sm"
                : "bg-[#FAF3E0]/30 border-[#6F4E37]/30 text-[#6F4E37] hover:bg-[#FAF3E0] hover:border-[#6F4E37]/50"
            }`}
          >
            <span className="text-[10px] tracking-wider font-bold uppercase">All Items</span>
          </button>
          {categories.map((c) => {
            const isActive = activeCat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`py-3 px-2 rounded-lg text-center flex flex-col items-center justify-center gap-1.5 transition-all border cursor-pointer select-none ${
                  isActive
                    ? "bg-[#6F4E37] text-white border-[#6F4E37]/50 shadow-sm"
                    : "bg-[#FAF3E0]/30 border-[#6F4E37]/30 text-[#6F4E37] hover:bg-[#FAF3E0] hover:border-[#6F4E37]/50"
                }`}
              >
                <span className="text-[10px] tracking-wider font-bold uppercase truncate max-w-full">
                  {c.name}
                </span>
                {!isActive && (
                  <div className="w-2 h-2 rounded-full mt-1" style={{ backgroundColor: c.color }} />
                )}
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
                    className="group relative rounded-xl bg-[#FAF3E0]/30 hover:bg-[#FAF3E0]/80 border border-[#6F4E37]/30 hover:border-[#6F4E37]/80 hover:shadow-md p-4 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between h-[105px] select-none"
                  >
                    <div className="w-full flex items-start justify-between">
                      <div className="font-semibold text-[#6F4E37] text-[13px] leading-snug line-clamp-2 max-w-[85%]">
                        {p.name}
                      </div>
                      {cat && (
                        <div
                          className="w-2.5 h-2.5 rounded-full border border-white shadow-sm shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                      )}
                    </div>
                    <div className="text-[#6F4E37] font-bold text-sm tracking-tight">
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
      <div className="col-span-3 flex flex-col bg-white border border-[#6F4E37]/30 p-4 rounded-xl overflow-hidden shadow-sm justify-between">
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Cart Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#6F4E37]/20 shrink-0">
            <div>
              <div className="text-[15px] font-bold text-[#6F4E37]">Order #{order.number}</div>
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
                    className={`group border rounded-lg p-3 transition-all cursor-pointer flex flex-col gap-2 ${
                      isSelected
                        ? "border-[#6F4E37]/50 bg-[#6F4E37] shadow-sm"
                        : "border-[#6F4E37]/30 bg-[#FAF3E0]/30 hover:border-[#6F4E37]/60 hover:bg-[#FAF3E0]/60"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className={`font-semibold text-[13px] transition ${isSelected ? "text-white" : "text-[#6F4E37]"}`}>
                          {p.name}
                        </div>
                        <div className={`text-[11px] mt-0.5 ${isSelected ? "text-[#6F4E37]" : "text-[#6F4E37]/60"}`}>₹{l.unitPrice} each</div>
                      </div>
                      <div className={`font-bold text-[13px] ${isSelected ? "text-white" : "text-[#6F4E37]"}`}>
                        ₹{(l.qty * l.unitPrice).toFixed(0)}
                      </div>
                    </div>

                      <div className="flex items-center justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5">
                        <button
                          className={`h-6 w-6 rounded-md flex items-center justify-center transition border cursor-pointer ${
                            isSelected
                              ? "bg-white/10 hover:bg-white/20 text-white border-white/10"
                              : "bg-white hover:bg-[#FAF3E0] text-[#6F4E37] border-[#6F4E37]/40"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setLineQty(order.id, l.productId, l.qty - 1);
                            updateOrder(order.id, { sentToKitchen: false });
                          }}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className={`font-bold text-xs w-6 text-center ${isSelected ? "text-white" : "text-[#6F4E37]"}`}>{l.qty}</span>
                        <button
                          className={`h-6 w-6 rounded-md flex items-center justify-center transition border cursor-pointer ${
                            isSelected
                              ? "bg-white/10 hover:bg-white/20 text-white border-white/10"
                              : "bg-white hover:bg-[#FAF3E0] text-[#6F4E37] border-[#6F4E37]/40"
                          }`}
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
                        className={`h-6 w-6 rounded-md hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition cursor-pointer ${
                          isSelected ? "text-[#6F4E37]" : "text-[#6F4E37]/40"
                        }`}
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
                      <div className="text-xs text-emerald-600 bg-emerald-50/50 px-2.5 py-1.5 rounded-lg border border-emerald-200 font-bold mt-1 text-center w-full">
                        {l.productDiscount.label} on ₹{(l.qty * l.unitPrice).toFixed(0)}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Kitchen, Totals, Actions */}
        <div className="space-y-3 shrink-0 pt-3 border-t border-[#6F4E37]/20">
          {order.sentToKitchen ? (
            <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold px-3 py-2.5 rounded-lg flex items-center justify-center gap-1 w-full select-none">
              ✓ Sent to Kitchen
            </span>
          ) : (
            <button
              onClick={async () => {
                if (order.lines.length === 0) {
                  toast.error("Cart is empty");
                  return;
                }
                try {
                  await sendOrderToKitchen(order.id);
                  toast.success("Order sent to kitchen successfully!");
                } catch (err) {
                  toast.error(err.message || "Failed to send order to kitchen");
                }
              }}
              className="bg-[#6F4E37] hover:bg-black text-white border border-[#6F4E37]/30 text-xs font-bold px-3 py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer w-full"
            >
              <Send className="w-3.5 h-3.5" />
              Send to Kitchen
            </button>
          )}

          {/* Quick action buttons row */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setCustomerOpen(true)}
              className="bg-[#FAF3E0]/50 hover:bg-[#FAF3E0] text-[#6F4E37] text-[11px] font-bold py-2 px-1 rounded-lg transition border border-[#6F4E37]/30 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <UserIcon className="w-3.5 h-3.5 text-[#6F4E37]" />
              Customer
            </button>
            <button
              onClick={() => setCouponOpen(true)}
              className="bg-[#FAF3E0]/50 hover:bg-[#FAF3E0] text-[#6F4E37] text-[11px] font-bold py-2 px-1 rounded-lg transition border border-[#6F4E37]/30 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Tag className="w-3.5 h-3.5 text-[#6F4E37]" />
              Discount
            </button>
            <button
              onClick={() => setEmailOpen(true)}
              className="bg-[#FAF3E0]/50 hover:bg-[#FAF3E0] text-[#6F4E37] text-[11px] font-bold py-2 px-1 rounded-lg transition border border-[#6F4E37]/30 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Mail className="w-3.5 h-3.5 text-[#6F4E37]" />
              Send
            </button>
          </div>

          {/* Totals */}
          <div className="space-y-1.5 text-xs pt-1">
            <div className="flex justify-between text-[#6F4E37]/60 font-medium">
              <span>Sub total</span>
              <span className="font-semibold text-[#6F4E37]">₹{order.subtotal.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-[#6F4E37]/60 font-medium">
              <span>Tax (GST 5%)</span>
              <span className="font-semibold text-[#6F4E37]">₹{order.tax.toFixed(0)}</span>
            </div>
            {order.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Discount</span>
                <span>-₹{order.discountTotal.toFixed(0)}{order.discountLabel ? ` (${order.discountLabel})` : ""}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm pt-2.5 border-t border-[#6F4E37]/30 text-[#6F4E37]">
              <span>Total</span>
              <span className="text-[#6F4E37] text-base font-extrabold">₹{order.total.toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* COLUMN 3: PAYMENT METHOD & NUMPAD PANEL */}
      <div className="col-span-3 flex flex-col bg-white border border-[#6F4E37]/30 rounded-xl p-3 shadow-sm justify-between h-full overflow-hidden">
        {/* Payment selector */}
        <div className="space-y-2 shrink-0">
          <h3 className="font-bold text-[11px] text-gray-400 uppercase tracking-[2px]">Payment</h3>
          <div className="flex flex-col gap-2">
            {paymentMethods
              .filter((p) => p.active)
              .map((p) => {
                const isActive = selectedPM === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPM(p.id)}
                    className={`w-full p-2 border rounded-lg text-left text-[13px] flex items-center justify-between transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "border-[#6F4E37] bg-[#6F4E37] text-white shadow-sm font-semibold"
                        : "border-[#6F4E37]/30 bg-[#FAF3E0]/30 text-[#6F4E37] hover:bg-[#FAF3E0] hover:border-[#6F4E37]/60 font-medium"
                    }`}
                  >
                    <span>{p.name}</span>
                    <span className={`text-[9px] tracking-wide font-bold uppercase px-1.5 py-0.5 rounded border ${isActive ? "bg-white/20 text-white border-white/40" : "bg-[#FAF3E0]/50 text-[#6F4E37]/60 border-[#6F4E37]/30"}`}>
                      {p.type}
                    </span>
                  </button>
                );
              })}
          </div>

          {/* QR or Inputs */}
          {selectedPM && (
            <div className="border-t border-[#6F4E37]/20 pt-2 space-y-1.5">
              {selectedPMObj?.type?.toUpperCase() === "CASH" && (
                <div className="space-y-2">
                  {/* Amount Received Input */}
                  <Label className="text-[10px] uppercase tracking-[1px] font-bold text-[#6F4E37]/60">Cash Received from Customer</Label>
                  <Input
                    type="number"
                    autoFocus
                    placeholder={`Min ₹${order.total.toFixed(0)}`}
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="bg-[#FAF3E0]/50 text-[#6F4E37] border-[#6F4E37]/30 h-10 rounded-lg focus:border-[#6F4E37] focus:bg-white focus:ring-1 focus:ring-[#6F4E37] text-[15px] font-bold"
                  />

                  {/* Quick denomination buttons */}
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      Math.ceil(order.total / 10) * 10,
                      Math.ceil(order.total / 50) * 50,
                      Math.ceil(order.total / 100) * 100,
                      Math.ceil(order.total / 500) * 500,
                    ]
                      .filter((v, i, arr) => arr.indexOf(v) === i && v >= order.total)
                      .slice(0, 4)
                      .map((denom) => (
                        <button
                          key={denom}
                          onClick={() => setCashReceived(String(denom))}
                          className={`py-1.5 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                            parseFloat(cashReceived) === denom
                              ? "bg-[#6F4E37] text-white border-[#6F4E37]"
                              : "bg-[#FAF3E0]/30 text-[#6F4E37] border-[#6F4E37]/30 hover:bg-[#FAF3E0]"
                          }`}
                        >
                          ₹{denom}
                        </button>
                      ))}
                  </div>

                  {/* Change Due — BIG display */}
                  {cashReceived && (
                    <div className={`rounded-lg p-2 text-center border transition-all ${
                      change >= 0
                        ? "bg-emerald-50 border-emerald-200"
                        : "bg-red-50 border-red-200"
                    }`}>
                      <div className={`text-[10px] font-bold uppercase tracking-[1px] mb-1 ${
                        change >= 0 ? "text-emerald-600" : "text-red-500"
                      }`}>
                        {change >= 0 ? "Change to Return" : "Amount Short"}
                      </div>
                      <div className={`text-xl font-black tracking-tight ${
                        change >= 0 ? "text-emerald-600" : "text-red-500"
                      }`}>
                        ₹{Math.abs(change).toFixed(0)}
                      </div>
                      {change < 0 && (
                        <div className="text-[10px] text-red-500 font-semibold mt-0.5">
                          Customer needs to pay ₹{Math.abs(change).toFixed(0)} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {selectedPMObj?.type?.toUpperCase() === "CARD" && (
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase tracking-[1px] font-bold text-[#6F4E37]/60">Transaction Ref</Label>
                  <Input
                    placeholder="Reference..."
                    value={cardRef}
                    onChange={(e) => setCardRef(e.target.value)}
                    className="bg-[#FAF3E0]/50 text-[#6F4E37] border-[#6F4E37]/30 h-10 rounded-lg focus:border-[#6F4E37] focus:bg-white focus:ring-1 focus:ring-[#6F4E37] text-[13px] font-medium"
                  />
                </div>
              )}

              {selectedPMObj?.type?.toUpperCase() === "UPI" && (
                <div className="flex flex-col items-center bg-[#FAF3E0]/30 p-2.5 rounded-lg border border-[#6F4E37]/30">
                  <div className="text-[10px] font-bold text-[#6F4E37] uppercase tracking-wider mb-2">
                    Online QR Payment
                  </div>
                  <div className="text-center text-[11px] font-medium text-[#6F4E37]/60 px-4 pb-1">
                    Click "Confirm Payment" to generate a secure Razorpay QR code for ₹{order.total.toFixed(0)}.
                  </div>
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
                className="w-full bg-[#6F4E37] hover:bg-black disabled:bg-[#FAF3E0] disabled:text-[#6F4E37]/40 disabled:border-[#6F4E37]/30 text-white font-bold py-2.5 rounded-lg text-[13px] uppercase tracking-widest transition-all duration-200 shadow-sm cursor-pointer border border-[#6F4E37]"
              >
                Confirm Payment
              </button>
            ) : (
              <div className="space-y-2">
                <div className="text-center text-emerald-500 font-bold text-sm flex items-center justify-center gap-1">
                  ✓ Paid successfully
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="flex-1 bg-[#FAF3E0]/50 hover:bg-[#FAF3E0] text-[#6F4E37] font-semibold py-2.5 px-3 rounded-lg text-[13px] transition border border-[#6F4E37]/30 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Printer className="w-4 h-4" /> Print
                  </button>
                  <button
                    onClick={reset}
                    className="flex-1 bg-[#6F4E37] hover:bg-black text-white font-semibold py-2.5 px-3 rounded-lg text-[13px] transition shadow-sm cursor-pointer"
                  >
                    New Order
                  </button>
                </div>
                {/* Send Receipt by Email */}
                <button
                  onClick={() => setEmailOpen(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-3 rounded-lg text-[13px] transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Mail className="w-4 h-4" /> Email Receipt to Customer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* NUMPAD COMPONENT PANEL */}
        <div className="bg-white rounded-xl border border-[#6F4E37]/30 p-2.5 flex flex-col justify-between min-h-[175px] shadow-sm mt-1">
          {/* Active Item Edit Indicator */}
          <div className="text-[10px] text-[#6F4E37]/50 uppercase tracking-widest font-bold flex items-center justify-between pb-2 border-b border-[#6F4E37]/20 mb-2">
            <span>Numpad Mode</span>
            {selectedLineProductId ? (
              <span className="text-[#6F4E37] font-bold normal-case">
                Editing: {products.find(p => p.id === selectedLineProductId)?.name}
              </span>
            ) : (
              <span className="text-[#6F4E37]/50 normal-case font-medium">
                {selectedPMObj?.type === "Cash" ? "Cash Keyboard Mode" : "Select item"}
              </span>
            )}
          </div>

          <div className="flex gap-2 flex-1 min-h-0">
            {/* Number grid */}
            <div className="flex-[4] grid grid-cols-3 gap-1">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "+/-", "0", "⌫"].map((key) => (
                <button
                  key={key}
                  onClick={() => handleNumpadKey(key)}
                  className={`font-semibold text-[15px] rounded-lg py-1.5 transition-all cursor-pointer flex items-center justify-center outline-none select-none ${
                    key === "⌫"
                      ? "bg-red-50 hover:bg-red-100 text-red-600 border border-red-200"
                      : "bg-[#FAF3E0]/30 hover:bg-[#FAF3E0] text-[#6F4E37] border border-[#6F4E37]/30 shadow-sm"
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
                className={`flex-1 rounded-lg text-[11px] font-bold transition-all flex flex-col items-center justify-center border cursor-pointer outline-none select-none shadow-sm ${
                  numpadMode === "price"
                    ? "bg-[#6F4E37] text-white border-[#6F4E37]"
                    : "bg-[#FAF3E0]/30 hover:bg-[#FAF3E0] text-[#6F4E37]/60 border-[#6F4E37]/30"
                }`}
              >
                <span>Prices</span>
              </button>
              <button
                onClick={() => selectMode("disc")}
                className={`flex-1 rounded-lg text-[11px] font-bold transition-all flex flex-col items-center justify-center border cursor-pointer outline-none select-none shadow-sm ${
                  numpadMode === "disc"
                    ? "bg-[#6F4E37] text-white border-[#6F4E37]"
                    : "bg-[#FAF3E0]/30 hover:bg-[#FAF3E0] text-[#6F4E37]/60 border-[#6F4E37]/30"
                }`}
              >
                <span>Disc.</span>
              </button>
              <button
                onClick={() => selectMode("qty")}
                className={`flex-1 rounded-lg text-[11px] font-bold transition-all flex flex-col items-center justify-center border cursor-pointer outline-none select-none shadow-sm ${
                  numpadMode === "qty"
                    ? "bg-[#6F4E37] text-white border-[#6F4E37]"
                    : "bg-[#FAF3E0]/30 hover:bg-[#FAF3E0] text-[#6F4E37]/60 border-[#6F4E37]/30"
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
        <DialogContent className="bg-white border border-[#6F4E37]/30 text-[#6F4E37] max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-[#6F4E37] font-bold">Apply Coupon</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="Enter coupon code (e.g. SUMMER20)"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="bg-[#FAF3E0]/50 text-[#6F4E37] border-[#6F4E37]/30 rounded-lg focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37]"
            />
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setCouponOpen(false)} className="border-[#6F4E37]/30 text-[#6F4E37] hover:bg-[#FAF3E0] flex-1 cursor-pointer">
              Cancel
            </Button>
            <Button onClick={applyCoupon} className="bg-[#6F4E37] hover:bg-black text-[#6F4E37] flex-1 font-bold cursor-pointer border border-[#6F4E37]">
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

      {/* Email Receipt dialog */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="bg-white border border-[#6F4E37]/30 text-[#2B2118] max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-[#6F4E37] font-bold">Email Receipt to Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2.5">
            <Label className="text-xs text-[#6F4E37]/60">Email Address</Label>
            <Input
              type="email"
              autoFocus
              placeholder="customer@example.com"
              value={emailVal || customer?.email || ""}
              onChange={(e) => setEmailVal(e.target.value)}
              className="bg-[#FAF3E0] text-[#2B2118] border-[#6F4E37]/30 rounded-xl"
            />
            {customer?.email && !emailVal && (
              <p className="text-[10px] text-[#6F4E37]/60 font-medium">
                Pre-filled from customer profile
              </p>
            )}
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setEmailOpen(false)} className="border-[#6F4E37]/20 text-[#6F4E37]/60 hover:bg-[#FAF3E0] flex-1 cursor-pointer">
              Cancel
            </Button>
            <Button
              onClick={async () => {
                const toEmail = emailVal || customer?.email;
                if (!toEmail) return toast.error("Enter a valid email address");
                if (!order?.id || order.id.length <= 15) {
                  toast.error("Order must be sent to kitchen first before emailing receipt");
                  return;
                }
                try {
                  const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
                  const raw = localStorage.getItem("cafe-auth-token");
                  const token = raw ? raw.replace(/^"|"$/g, "") : null;
                  const res = await fetch(`${BASE}/orders/${order.id}/send-receipt`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify({ email: toEmail }),
                  });
                  const json = await res.json().catch(() => ({}));
                  if (!res.ok) throw new Error(json.message || "Failed to send receipt");
                  toast.success(`Receipt sent to ${toEmail}`);
                  setEmailOpen(false);
                  setEmailVal("");
                } catch (err) {
                  toast.error(err.message || "Failed to send receipt");
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white flex-1 font-bold cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5 mr-1.5" /> Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
