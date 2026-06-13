import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  useListKdsTickets, 
  getListKdsTicketsQueryKey, 
  useAdvanceKdsTicket, 
  useToggleKdsItem,
  ListKdsTicketsStage
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, ChefHat, Check, ArrowRight, ArrowLeft, Clock, MonitorSmartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

export default function KdsPage() {
  const [activeStage, setActiveStage] = useState<ListKdsTicketsStage | "All">("All");
  const [search, setSearch] = useState("");
  
  const queryClient = useQueryClient();
  const advanceTicket = useAdvanceKdsTicket();
  const toggleItem = useToggleKdsItem();

  const queryParams = {
    query: {
      queryKey: [...getListKdsTicketsQueryKey(), activeStage === "All" ? undefined : activeStage, search]
    }
  };

  const { data: tickets, isLoading } = useListKdsTickets(
    { stage: activeStage === "All" ? undefined : activeStage, search },
    queryParams
  );

  // Polling every 10 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: getListKdsTicketsQueryKey() });
    }, 10000);
    return () => clearInterval(intervalId);
  }, [queryClient]);

  // Fake current time to update relative times in tickets
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(intervalId);
  }, []);

  const handleToggleItem = (ticketId: number, itemIndex: number) => {
    toggleItem.mutate({ id: ticketId, itemIndex }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListKdsTicketsQueryKey() })
    });
  };

  const handleAdvanceTicket = (ticketId: number) => {
    advanceTicket.mutate({ id: ticketId }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListKdsTicketsQueryKey() })
    });
  };

  const stages: { id: ListKdsTicketsStage | "All", label: string }[] = [
    { id: "All", label: "All Tickets" },
    { id: "ToCook", label: "To Cook" },
    { id: "Preparing", label: "Preparing" },
    { id: "Completed", label: "Completed" }
  ];

  const getStageColor = (stage: string) => {
    switch(stage) {
      case "ToCook": return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50";
      case "Preparing": return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50";
      case "Completed": return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getNextStageLabel = (currentStage: string) => {
    if (currentStage === "ToCook") return "Start Preparing";
    if (currentStage === "Preparing") return "Mark Complete";
    return "";
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-neutral-950 text-neutral-100 font-sans selection:bg-primary/30">
      {/* Header */}
      <header className="h-16 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="bg-primary/20 p-2 rounded-lg text-primary">
            <ChefHat size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Kitchen Display</h1>
          <Badge variant="outline" className="bg-neutral-800 border-neutral-700 text-neutral-300 animate-pulse ml-2">
            Live
          </Badge>
        </div>

        <div className="flex items-center gap-6 flex-1 max-w-xl mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Search ticket or table..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-neutral-800 border-neutral-700 text-neutral-100 placeholder:text-neutral-500 focus-visible:ring-primary/50 h-10 rounded-full"
            />
          </div>
        </div>

        <Link href="/pos/order">
          <Button variant="outline" className="border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white">
            <MonitorSmartphone className="mr-2 h-4 w-4" />
            Back to POS
          </Button>
        </Link>
      </header>

      {/* Tabs */}
      <div className="bg-neutral-900/50 border-b border-neutral-800 px-6 overflow-x-auto">
        <div className="flex space-x-1 py-3 min-w-max">
          {stages.map(stage => (
            <button
              key={stage.id}
              onClick={() => setActiveStage(stage.id)}
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-medium transition-all",
                activeStage === stage.id 
                  ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.3)]" 
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
              )}
            >
              {stage.label}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board Area */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        {isLoading ? (
          <div className="flex gap-6 h-full">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="w-[350px] shrink-0 bg-neutral-900 rounded-xl border border-neutral-800 p-4 animate-pulse">
                <div className="h-6 w-32 bg-neutral-800 rounded mb-4" />
                <div className="space-y-3">
                  <div className="h-40 bg-neutral-800 rounded-lg" />
                  <div className="h-40 bg-neutral-800 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : tickets?.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-500">
            <ChefHat className="h-20 w-20 mb-6 opacity-20" />
            <p className="text-2xl font-medium text-neutral-400 mb-2">No tickets in this view</p>
            <p className="text-lg">Enjoy the quiet moment.</p>
          </div>
        ) : (
          <div className="flex gap-6 h-full items-start">
            {/* If All is selected, we group by stage. If a specific stage is selected, we just list them. */}
            
            {(activeStage === "All" ? ["ToCook", "Preparing", "Completed"] : [activeStage]).map(stage => {
              const stageTickets = tickets?.filter(t => t.stage === stage) || [];
              if (activeStage === "All" && stageTickets.length === 0) return null;

              return (
                <div key={stage} className={cn("flex flex-col h-full shrink-0", activeStage === "All" ? "w-[380px]" : "w-full")}>
                  {activeStage === "All" && (
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="font-bold text-lg text-white uppercase tracking-wider">{stage}</h2>
                      <Badge variant="secondary" className="bg-neutral-800 text-neutral-300 font-mono">
                        {stageTickets.length}
                      </Badge>
                    </div>
                  )}
                  
                  <div className={cn(
                    "overflow-y-auto pr-2 pb-6 space-y-4", 
                    activeStage !== "All" && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 space-y-0"
                  )}>
                    {stageTickets.map(ticket => {
                      const isCompleted = ticket.stage === "Completed";
                      const allItemsDone = ticket.items.every(i => i.done);
                      
                      return (
                        <Card 
                          key={ticket.id} 
                          className={cn(
                            "bg-neutral-900 border-neutral-800 shadow-xl overflow-hidden transition-all",
                            isCompleted ? "opacity-70" : "hover:border-neutral-700"
                          )}
                        >
                          {/* Ticket Header */}
                          <div className={cn("px-4 py-3 border-b flex justify-between items-center cursor-pointer", getStageColor(ticket.stage))}
                               onClick={() => !isCompleted && handleAdvanceTicket(ticket.id)}>
                            <div className="font-mono font-bold text-lg flex items-center gap-2">
                              #{ticket.orderNumber.split('-').pop()}
                              {ticket.tableNumber && (
                                <Badge variant="secondary" className="ml-2 bg-black/20 hover:bg-black/30 text-current border-none">
                                  T{ticket.tableNumber}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center text-xs font-medium opacity-80 gap-1.5">
                              <Clock size={12} />
                              {formatDistanceToNow(new Date(ticket.createdAt))}
                            </div>
                          </div>

                          {/* Items */}
                          <div className="p-1">
                            {ticket.items.map((item, idx) => (
                              <button
                                key={`${item.productId}-${idx}`}
                                onClick={() => handleToggleItem(ticket.id, idx)}
                                disabled={isCompleted}
                                className={cn(
                                  "w-full text-left p-3 flex items-start gap-3 rounded-lg transition-colors my-1",
                                  item.done ? "bg-neutral-800/50 text-neutral-500 line-through" : "hover:bg-neutral-800 bg-neutral-900 text-white"
                                )}
                              >
                                <div className={cn(
                                  "w-6 h-6 shrink-0 rounded flex items-center justify-center border font-mono text-sm font-bold mt-0.5",
                                  item.done ? "bg-neutral-700 border-neutral-600 text-neutral-400" : "bg-primary/20 border-primary/50 text-primary"
                                )}>
                                  {item.done ? <Check size={14} /> : item.qty}
                                </div>
                                <span className="font-medium text-[15px] leading-tight pt-1">{item.productName}</span>
                              </button>
                            ))}
                          </div>

                          {/* Actions */}
                          {!isCompleted && (
                            <div className="px-4 py-3 border-t border-neutral-800 bg-neutral-900/80">
                              <Button 
                                className="w-full font-bold shadow-md" 
                                variant={allItemsDone ? "default" : "secondary"}
                                onClick={() => handleAdvanceTicket(ticket.id)}
                              >
                                {getNextStageLabel(ticket.stage)}
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}