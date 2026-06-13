import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Coffee, Package, Tags, CreditCard, Ticket, BookOpen, UserCog, Monitor, BarChart3, LogOut, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const items = [
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Category", icon: Tags },
  { to: "/admin/payment-methods", label: "Payment method", icon: CreditCard },
  { to: "/admin/coupons", label: "Coupon & Promotion", icon: Ticket },
  { to: "/admin/booking", label: "Booking", icon: BookOpen },
  { to: "/admin/users", label: "User/Employee", icon: UserCog },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
];

export function AdminShell({ children, title }: { children: React.ReactNode; title: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const logout = useStore((s) => s.logout);

  return (
    <div className="min-h-screen flex bg-muted/30">
      <aside className="w-56 bg-card border-r flex flex-col">
        <div className="p-4 flex items-center gap-2 border-b">
          <Coffee className="w-6 h-6 text-amber-700" />
          <span className="font-bold">Cafe Admin</span>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {items.map((it) => {
            const Icon = it.icon;
            const active = pathname === it.to;
            return (
              <Link
                key={it.to}
                to={it.to}
                className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                  active ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4" />
                {it.label}
              </Link>
            );
          })}
          <a
            href="/kds"
            target="_blank"
            className="flex items-center gap-2 px-3 py-2 rounded text-sm hover:bg-muted"
          >
            <Monitor className="w-4 h-4" /> KDS
          </a>
        </nav>
        <div className="p-2 border-t space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => navigate({ to: "/pos" })}
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to POS
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              logout();
              navigate({ to: "/auth" });
            }}
          >
            <LogOut className="w-4 h-4 mr-1" /> Log Out
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-4">{title}</h1>
        {children}
      </main>
    </div>
  );
}
