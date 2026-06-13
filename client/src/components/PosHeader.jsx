import { Link, useNavigate, useLocation } from "react-router-dom";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { FloorPopup } from "./FloorPopup";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  User as UserIcon,
  ShoppingCart,
  Users,
  Grid3x3,
  ClipboardList,
  LogOut,
  Package,
  Tags,
  CreditCard,
  Ticket,
  BookOpen,
  UserCog,
  Monitor,
  BarChart3,
  Search,
  Coffee,
  LayoutGrid,
} from "lucide-react";

import { CustomerCaptureModal } from "./CustomerCaptureModal";

export function PosHeader() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const user = useStore((s) => s.users.find((u) => u.id === s.currentUserId));
  const isAdmin = user?.role === "User";
  const tableId = useStore((s) => s.currentTableId);
  const table = useStore((s) => s.tables.find((t) => t.id === tableId));
  const logout = useStore((s) => s.logout);
  const closeSession = useStore((s) => s.closeSession);
  const setCurrentTable = useStore((s) => s.setCurrentTable);
  const searchQuery = useStore((s) => s.searchQuery);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const createDraftOrder = useStore((s) => s.createDraftOrder);
  const setDraftOrder = useStore((s) => s.setDraftOrder);

  const [showFloor, setShowFloor] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [pendingTable, setPendingTable] = useState(null);

  const handleLogout = () => {
    closeSession();
    logout();
    navigate("/");
  };

  const handleSelectTable = (tid) => {
    const isOccupied = useStore.getState().orders.some(o => o.tableId === tid && o.status === "Draft");
    if (!isOccupied) {
      setPendingTable(tid);
      setCaptureOpen(true);
      setShowFloor(false);
    } else {
      setCurrentTable(tid);
      setShowFloor(false);
      navigate("/pos");
    }
  };

  const handleCustomerCaptured = (customerId) => {
    setCaptureOpen(false);
    const newId = createDraftOrder(pendingTable, customerId);
    setDraftOrder(newId);
    setCurrentTable(pendingTable);
    navigate("/pos");
  };

  const isMainPos = pathname === "/pos" || pathname === "/pos/";

  const navLinkClass = (active) =>
    `h-10 w-10 rounded-md border flex items-center justify-center transition-all ${
      active
        ? "bg-[#6F4E37] border-[#6F4E37] text-white shadow-sm"
        : "border-[#6F4E37]/30 bg-white text-[#6F4E37] hover:bg-[#FAF3E0] hover:text-[#6F4E37] hover:border-[#6F4E37]/50"
    }`;

  return (
    <header className="h-16 border-b border-[#6F4E37]/20 bg-white flex items-center justify-between px-6 shrink-0 shadow-sm select-none z-30">
      <FloorPopup open={showFloor} onSelect={handleSelectTable} onOpenChange={setShowFloor} />
      <CustomerCaptureModal open={captureOpen} onOpenChange={setCaptureOpen} tableId={pendingTable} onSuccess={handleCustomerCaptured} />

      {/* 1. Logo and Brand */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-[#6F4E37] border border-[#6F4E37]/20 shadow-sm">
          <Coffee className="w-4 h-4 text-white" />
          <span className="font-bold text-[13px] tracking-wider text-white uppercase">
            Odoo Café
          </span>
        </div>
      </div>

      {/* 2. Product Search Bar */}
      <div className="flex-1 max-w-xs md:max-w-md mx-6 relative">
        {isMainPos ? (
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6F4E37]/60" />
            <input
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAF3E0]/50 text-[#6F4E37] placeholder-[#6F4E37]/40 text-[13px] font-medium pl-9 pr-4 py-2 h-10 rounded-md border border-[#6F4E37]/30 focus:bg-white focus:border-[#6F4E37] focus:ring-1 focus:ring-[#6F4E37] outline-none transition-all"
            />
          </div>
        ) : (
          <div className="w-full text-[#6F4E37] text-[11px] font-bold tracking-[2px] uppercase pl-2">
            Odoo Café Management System
          </div>
        )}
      </div>

      {/* 3. Navigation items, Table Indicator, Employee, Hamburger */}
      <div className="flex items-center gap-3">
        {/* POS Order Link */}
        <Link to="/pos" title="POS Order" className={navLinkClass(isMainPos)}>
          <ShoppingCart className="w-4.5 h-4.5" />
        </Link>

        {/* Orders Link */}
        <Link to="/pos/orders" title="Orders" className={navLinkClass(pathname === "/pos/orders")}>
          <ClipboardList className="w-4.5 h-4.5" />
        </Link>

        {/* Customer Link */}
        <Link to="/pos/customers" title="Customer" className={navLinkClass(pathname === "/pos/customers")}>
          <Users className="w-4.5 h-4.5" />
        </Link>

        {/* Table View Trigger / Current Table Indicator */}
        <button
          onClick={() => setShowFloor(true)}
          title="Table View"
          className={`h-10 px-4 rounded-md border font-bold text-[13px] flex items-center gap-2 transition-all cursor-pointer ${
            table
              ? "bg-[#6F4E37] border-[#6F4E37] text-white shadow-sm"
              : "border-[#6F4E37]/30 bg-white text-[#6F4E37] hover:bg-[#FAF3E0] hover:text-[#6F4E37] hover:border-[#6F4E37]/50"
          }`}
        >
          <Grid3x3 className="w-4 h-4" />
          <span>{table ? `Table ${table.number}` : "Table View"}</span>
        </button>

        {/* Table Status Link */}
        <Link to="/pos/tables" title="Table Status" className={navLinkClass(pathname === "/pos/tables")}>
          <LayoutGrid className="w-4.5 h-4.5" />
        </Link>

        <div className="h-6 w-px bg-[#6F4E37]/30 mx-2" />

        {/* Employee Icon & Name */}
        <div className="flex items-center gap-2.5 text-[13px] font-bold text-[#6F4E37]">
          <div className="w-8 h-8 rounded-full bg-[#FAF3E0] border border-[#6F4E37]/30 flex items-center justify-center text-[#6F4E37]">
            <UserIcon className="w-4 h-4" />
          </div>
          <span className="hidden lg:inline">{user?.name ?? "Employee"}</span>
        </div>

        {/* Hamburger Dropdown Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="border border-[#6F4E37]/30 text-[#6F4E37] h-10 w-10 rounded-md hover:bg-[#FAF3E0] hover:text-[#6F4E37] cursor-pointer transition-all ml-1"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-white border border-[#6F4E37]/30 text-[#6F4E37] shadow-xl rounded-md p-1.5"
          >
            {isAdmin && (
              <>
                {[
                  { to: "/admin/products", label: "Products", icon: Package },
                  { to: "/admin/categories", label: "Category", icon: Tags },
                  { to: "/admin/payment-methods", label: "Payment Method", icon: CreditCard },
                  { to: "/admin/coupons", label: "Coupon & Promotion", icon: Ticket },
                  { to: "/admin/booking", label: "Booking", icon: BookOpen },
                  { to: "/admin/users", label: "User / Employee", icon: UserCog },
                  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
                ].map(({ to, label, icon: Icon }) => (
                  <DropdownMenuItem
                    key={to}
                    onClick={() => navigate(to)}
                    className="hover:bg-[#FAF3E0] hover:text-[#6F4E37] rounded-md cursor-pointer px-3.5 py-2.5 text-[13px] font-semibold transition"
                  >
                    <Icon className="w-4 h-4 mr-3 text-[#6F4E37]/70" /> {label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-[#6F4E37]/20 my-1" />
              </>
            )}
            <DropdownMenuItem
              onClick={() => window.open("/kds", "_blank")}
              className="hover:bg-[#FAF3E0] hover:text-[#6F4E37] rounded-md cursor-pointer px-3.5 py-2.5 text-[13px] font-semibold transition"
            >
              <Monitor className="w-4 h-4 mr-3 text-[#6F4E37]/70" /> KDS
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#6F4E37]/20 my-1" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="hover:bg-red-50 text-red-600 rounded-md cursor-pointer px-3.5 py-2.5 text-[13px] font-semibold transition"
            >
              <LogOut className="w-4 h-4 mr-3" /> Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
