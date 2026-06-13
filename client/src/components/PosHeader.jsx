import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
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
} from "lucide-react";

export function PosHeader() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const user = useStore((s) => s.users.find((u) => u.id === s.currentUserId));
  const isAdmin = user?.role === "User";
  const tableId = useStore((s) => s.currentTableId);
  const table = useStore((s) => s.tables.find((t) => t.id === tableId));
  const logout = useStore((s) => s.logout);
  const closeSession = useStore((s) => s.closeSession);
  const setCurrentTable = useStore((s) => s.setCurrentTable);
  const searchQuery = useStore((s) => s.searchQuery);
  const setSearchQuery = useStore((s) => s.setSearchQuery);

  const [showFloor, setShowFloor] = useState(false);

  const handleLogout = () => {
    closeSession();
    logout();
    navigate({ to: "/auth" });
  };

  const handleSelectTable = (tid) => {
    setCurrentTable(tid);
    setShowFloor(false);
    navigate({ to: "/pos" });
  };

  const isMainPos = pathname === "/pos" || pathname === "/pos/";

  const navLinkClass = (active) =>
    `h-10 w-10 rounded-xl border flex items-center justify-center transition-all ${
      active
        ? "bg-[#6F4E37] border-[#6F4E37] text-white shadow-md shadow-[#6F4E37]/25"
        : "border-[#6F4E37]/30 bg-white text-[#6F4E37] hover:bg-[#6F4E37] hover:text-white hover:border-[#6F4E37]"
    }`;

  return (
    <header className="h-16 border-b border-[#6F4E37]/20 bg-white flex items-center justify-between px-4 shrink-0 shadow-sm select-none">
      <FloorPopup open={showFloor} onSelect={handleSelectTable} onOpenChange={setShowFloor} />

      {/* 1. Logo and Brand */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#6F4E37] shadow-md">
          <Coffee className="w-4 h-4 text-white" />
          <span className="font-extrabold text-sm tracking-wide text-white uppercase">
            Odoo Café
          </span>
        </div>
      </div>

      {/* 2. Product Search Bar */}
      <div className="flex-1 max-w-xs md:max-w-md mx-4 relative">
        {isMainPos ? (
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6F4E37]/50" />
            <input
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAF3E0] text-[#2B2118] placeholder-[#6F4E37]/40 text-sm pl-9 pr-4 py-2 rounded-xl border border-[#6F4E37]/25 focus:bg-white focus:border-[#6F4E37] outline-none transition"
            />
          </div>
        ) : (
          <div className="w-full text-[#6F4E37]/50 text-xs font-semibold tracking-wider uppercase pl-2">
            Odoo Café Management System
          </div>
        )}
      </div>

      {/* 3. Navigation items, Table Indicator, Employee, Hamburger */}
      <div className="flex items-center gap-2.5">
        {/* POS Order Link */}
        <Link to="/pos" title="POS Order" className={navLinkClass(isMainPos)}>
          <ShoppingCart className="w-4 h-4" />
        </Link>

        {/* Orders Link */}
        <Link to="/pos/orders" title="Orders" className={navLinkClass(pathname === "/pos/orders")}>
          <ClipboardList className="w-4 h-4" />
        </Link>

        {/* Customer Link */}
        <Link to="/pos/customers" title="Customer" className={navLinkClass(pathname === "/pos/customers")}>
          <Users className="w-4 h-4" />
        </Link>

        {/* Table View Trigger / Current Table Indicator */}
        <button
          onClick={() => setShowFloor(true)}
          title="Table View"
          className={`h-10 px-3.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
            table
              ? "bg-[#6F4E37]/10 border-[#6F4E37] text-[#6F4E37]"
              : "border-[#6F4E37]/30 bg-white text-[#6F4E37] hover:bg-[#6F4E37] hover:text-white hover:border-[#6F4E37]"
          }`}
        >
          <Grid3x3 className="w-4 h-4" />
          <span>{table ? `Table ${table.number}` : "Table View"}</span>
        </button>

        <div className="h-6 w-[1px] bg-[#6F4E37]/15 mx-1" />

        {/* Employee Icon & Name */}
        <div className="flex items-center gap-2 text-xs font-bold text-[#6F4E37]">
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
              className="border border-[#6F4E37]/25 text-[#6F4E37] h-10 w-10 rounded-xl hover:bg-[#6F4E37] hover:text-white cursor-pointer transition-all"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-white border border-[#6F4E37]/20 text-[#2B2118] shadow-xl rounded-xl p-1.5"
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
                    onClick={() => navigate({ to })}
                    className="hover:bg-[#FAF3E0] hover:text-[#6F4E37] rounded-lg cursor-pointer px-3.5 py-2.5 text-xs font-semibold transition"
                  >
                    <Icon className="w-4 h-4 mr-2.5 text-[#6F4E37]" /> {label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-[#6F4E37]/15 my-1" />
              </>
            )}
            <DropdownMenuItem
              onClick={() => window.open("/kds", "_blank")}
              className="hover:bg-[#FAF3E0] hover:text-[#6F4E37] rounded-lg cursor-pointer px-3.5 py-2.5 text-xs font-semibold transition"
            >
              <Monitor className="w-4 h-4 mr-2.5 text-[#6F4E37]" /> KDS
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#6F4E37]/15 my-1" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="hover:bg-red-50 text-red-500 hover:text-red-600 rounded-lg cursor-pointer px-3.5 py-2.5 text-xs font-semibold transition"
            >
              <LogOut className="w-4 h-4 mr-2.5" /> Log Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
