import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  useGetMe, 
  useGetCurrentSession, 
  useOpenSession, 
  useCloseSession,
  useListFloors,
  useListTables 
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { 
  Coffee, 
  Menu, 
  ShoppingCart, 
  ClipboardList, 
  Users, 
  LayoutGrid, 
  LogOut,
  Settings,
  CircleUser
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function PosLayout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading: isUserLoading, isError: isUserError } = useGetMe();
  
  const { data: session, isLoading: isSessionLoading, isError: isSessionError } = useGetCurrentSession();
  const openSession = useOpenSession();
  const closeSession = useCloseSession();

  const [isFloorModalOpen, setIsFloorModalOpen] = useState(false);
  const { data: floors } = useListFloors();
  const { data: tables } = useListTables();

  useEffect(() => {
    if (isUserError) {
      setLocation("/auth");
    }
  }, [isUserError, setLocation]);

  useEffect(() => {
    // If no session exists, automatically open one
    if (isSessionError && !openSession.isPending && user) {
      openSession.mutate(undefined, {
        onSuccess: (newSession) => {
          localStorage.setItem("pos_session_id", newSession.id.toString());
          toast.success("Shift started");
          
          // Show floor modal if we just opened a session and no table is selected
          const currentTable = localStorage.getItem("pos_table_id");
          if (!currentTable && location === "/pos/order") {
            setIsFloorModalOpen(true);
          }
        }
      });
    } else if (session) {
      localStorage.setItem("pos_session_id", session.id.toString());
      
      const currentTable = localStorage.getItem("pos_table_id");
      if (!currentTable && location === "/pos/order") {
        setIsFloorModalOpen(true);
      }
    }
  }, [session, isSessionError, user, location]);

  const handleLogout = () => {
    localStorage.removeItem("pos_token");
    localStorage.removeItem("pos_session_id");
    setLocation("/auth");
  };

  const handleCloseSession = () => {
    if (confirm("Are you sure you want to end your shift?")) {
      closeSession.mutate(undefined, {
        onSuccess: () => {
          localStorage.removeItem("pos_session_id");
          localStorage.removeItem("pos_table_id");
          localStorage.removeItem("pos_order_id");
          toast.success("Shift ended");
          handleLogout();
        }
      });
    }
  };

  const selectTable = (tableId: number) => {
    localStorage.setItem("pos_table_id", tableId.toString());
    localStorage.removeItem("pos_order_id"); // Clear current order to start fresh on new table
    setIsFloorModalOpen(false);
    
    // Force a re-render/reload of the order component if we're on it
    if (location === "/pos/order") {
      // Just a small hack to force re-render, wouter location update
      setLocation("/pos/orders");
      setTimeout(() => setLocation("/pos/order"), 10);
    } else {
      setLocation("/pos/order");
    }
  };

  if (isUserLoading || isSessionLoading || openSession.isPending) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Spinner className="size-8 text-primary" />
          <p className="text-muted-foreground font-medium animate-pulse">
            {openSession.isPending ? "Starting your shift..." : "Loading POS..."}
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const currentTableId = localStorage.getItem("pos_table_id");
  const currentTable = currentTableId && tables ? tables.find(t => t.id.toString() === currentTableId) : null;

  const navItems = [
    { name: "Order", href: "/pos/order", icon: ShoppingCart },
    { name: "Orders", href: "/pos/orders", icon: ClipboardList },
    { name: "Customers", href: "/pos/customers", icon: Users },
    { name: "Tables", href: "/pos/tables", icon: LayoutGrid },
  ];

  return (
    <div className="flex flex-col h-[100dvh] w-full overflow-hidden bg-background">
      {/* Top Navigation Bar */}
      <header className="h-14 bg-card border-b border-border flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-6">
          <Link href="/pos/order" className="flex items-center gap-2 text-primary font-bold">
            <div className="bg-primary/10 p-1.5 rounded-md">
              <Coffee size={20} />
            </div>
            <span className="hidden sm:inline-block">Cafe POS</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button 
                    variant={isActive ? "secondary" : "ghost"} 
                    className={cn(
                      "h-9 px-3 font-medium transition-colors",
                      isActive ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {currentTable && (
            <Button 
              variant="outline" 
              className="h-9 font-mono border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 hidden sm:flex"
              onClick={() => setIsFloorModalOpen(true)}
            >
              T-{currentTable.number}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 gap-2 px-2 hover:bg-muted">
                <CircleUser className="h-5 w-5 text-muted-foreground" />
                <div className="flex flex-col items-start text-left hidden sm:flex">
                  <span className="text-sm font-medium leading-none">{user.name}</span>
                  <span className="text-[10px] text-muted-foreground leading-none mt-1">
                    {user.role === "User" ? "Admin" : "Employee"}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {user.role === "User" && (
                <DropdownMenuItem asChild>
                  <Link href="/admin/products" className="w-full flex items-center cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Admin Dashboard</span>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleCloseSession} className="text-amber-600 focus:text-amber-600 focus:bg-amber-50 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>End Shift</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {navItems.map((item) => (
                  <DropdownMenuItem key={item.href} asChild>
                    <Link href={item.href} className="w-full flex items-center cursor-pointer">
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>

      {/* Select Table / Floor Modal */}
      <Dialog open={isFloorModalOpen} onOpenChange={(open) => {
        // Only allow closing if a table is selected
        if (localStorage.getItem("pos_table_id") || !open) {
          setIsFloorModalOpen(open);
        }
      }}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Select a Table</DialogTitle>
          </DialogHeader>
          
          {floors?.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No floors or tables configured. Please set them up in Admin.
            </div>
          ) : (
            <div className="space-y-6 pt-4">
              {floors?.map(floor => {
                const floorTables = tables?.filter(t => t.floorId === floor.id && t.active) || [];
                if (floorTables.length === 0) return null;
                
                return (
                  <div key={floor.id} className="space-y-3">
                    <h3 className="font-medium text-lg border-b pb-2">{floor.name}</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {floorTables.map(table => (
                        <button
                          key={table.id}
                          onClick={() => selectTable(table.id)}
                          className={cn(
                            "relative aspect-square rounded-xl flex flex-col items-center justify-center p-2 transition-all border-2",
                            table.hasActiveOrder 
                              ? "bg-amber-100/50 border-amber-300 text-amber-900 hover:bg-amber-200/50" 
                              : "bg-card border-border hover:border-primary/50 hover:bg-muted"
                          )}
                        >
                          <span className="text-xl font-bold font-mono">T{table.number}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Users className="w-3 h-3" /> {table.seats}
                          </span>
                          {table.hasActiveOrder && (
                            <Badge variant="secondary" className="absolute -top-2 -right-2 bg-amber-500 hover:bg-amber-600 text-white border-none shadow-sm text-[10px] px-1.5 min-w-[20px] h-5 flex items-center justify-center">
                              Busy
                            </Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}