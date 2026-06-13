import { Link, useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { 
  Coffee, 
  Package, 
  Tags, 
  CreditCard, 
  Ticket, 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  MonitorSmartphone,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AdminSidebarProps {
  className?: string;
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const [location, setLocation] = useLocation();
  const { data: user } = useGetMe();

  const handleLogout = () => {
    localStorage.removeItem("pos_token");
    localStorage.removeItem("pos_session_id");
    setLocation("/auth");
  };

  const navItems = [
    { name: "Products", href: "/admin/products", icon: Package },
    { name: "Categories", href: "/admin/categories", icon: Tags },
    { name: "Payment Methods", href: "/admin/payment-methods", icon: CreditCard },
    { name: "Coupons", href: "/admin/coupons", icon: Ticket },
    { name: "Floor Plan", href: "/admin/floors", icon: LayoutDashboard },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Reports", href: "/admin/reports", icon: BarChart3 },
  ];

  return (
    <div className={cn("flex flex-col h-[100dvh] bg-sidebar border-r border-sidebar-border w-64 shrink-0", className)}>
      <div className="p-6 flex items-center gap-3 border-b border-sidebar-border/50">
        <div className="w-8 h-8 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center shadow-sm">
          <Coffee size={18} />
        </div>
        <div>
          <h2 className="font-bold text-lg leading-tight tracking-tight text-sidebar-foreground">Odoo Cafe</h2>
          <p className="text-xs text-sidebar-foreground/60 uppercase tracking-widest font-semibold">Admin</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = location.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className="w-full">
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon size={18} className={cn(isActive ? "text-sidebar-primary" : "")} />
                {item.name}
              </div>
            </Link>
          );
        })}

        <div className="mt-8 mb-2 px-3 text-xs font-semibold text-sidebar-foreground/40 uppercase tracking-wider">
          Apps
        </div>
        
        <Link href="/pos/order" className="w-full">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all duration-200 cursor-pointer">
            <MonitorSmartphone size={18} />
            POS Terminal
          </div>
        </Link>
        <Link href="/kds" className="w-full">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all duration-200 cursor-pointer">
            <LayoutDashboard size={18} />
            Kitchen Display
          </div>
        </Link>
      </div>

      <div className="p-4 border-t border-sidebar-border/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary/10 flex items-center justify-center text-sidebar-primary font-bold text-sm">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate text-sidebar-foreground">{user?.name || "User"}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{user?.email || ""}</p>
          </div>
        </div>
        <Button variant="outline" className="w-full justify-start text-sidebar-foreground" onClick={handleLogout}>
          <LogOut size={16} className="mr-2 opacity-70" />
          Log Out
        </Button>
      </div>
    </div>
  );
}