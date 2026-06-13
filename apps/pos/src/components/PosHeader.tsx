import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Menu,
  Coffee,
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
} from "lucide-react";

export function PosHeader() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const user = useStore((s) => s.users.find((u) => u.id === s.currentUserId));
  const tableId = useStore((s) => s.currentTableId);
  const table = useStore((s) => s.tables.find((t) => t.id === tableId));
  const logout = useStore((s) => s.logout);
  const closeSession = useStore((s) => s.closeSession);

  const handleLogout = () => {
    closeSession();
    logout();
    navigate({ to: "/auth" });
  };

  const navItem = (to: string, label: string, Icon: any) => (
    <Link
      to={to}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition ${
        pathname === to ? "bg-primary text-primary-foreground" : "hover:bg-muted"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );

  return (
    <header className="border-b bg-card sticky top-0 z-40">
      <div className="flex items-center gap-2 px-4 h-14">
        <div className="flex items-center gap-2 mr-4">
          <Coffee className="w-6 h-6 text-amber-700" />
          <span className="font-bold hidden md:inline">Cafe POS</span>
        </div>
        <nav className="flex items-center gap-1">
          {navItem("/pos", "POS Order", ShoppingCart)}
          {navItem("/pos/orders", "Orders", ClipboardList)}
          {navItem("/pos/customers", "Customer", Users)}
          {navItem("/pos/tables", "Tables", Grid3x3)}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {table && (
            <span className="text-sm bg-amber-100 text-amber-900 px-2 py-1 rounded">
              Table {table.number}
            </span>
          )}
          <div className="flex items-center gap-1.5 text-sm">
            <UserIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{user?.name}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => navigate({ to: "/admin/products" })}>
                <Package className="w-4 h-4 mr-2" /> Products
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ to: "/admin/categories" })}>
                <Tags className="w-4 h-4 mr-2" /> Category
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ to: "/admin/payment-methods" })}>
                <CreditCard className="w-4 h-4 mr-2" /> Payment method
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ to: "/admin/coupons" })}>
                <Ticket className="w-4 h-4 mr-2" /> Coupon & Promotion
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ to: "/admin/booking" })}>
                <BookOpen className="w-4 h-4 mr-2" /> Booking
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ to: "/admin/users" })}>
                <UserCog className="w-4 h-4 mr-2" /> User/Employee
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open("/kds", "_blank")}>
                <Monitor className="w-4 h-4 mr-2" /> KDS
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate({ to: "/admin/reports" })}>
                <BarChart3 className="w-4 h-4 mr-2" /> Reports
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" /> Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
