import { PosLayout } from "@/components/layout/pos-layout";
import { useListFloors, useListTables } from "@workspace/api-client-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, LayoutGrid } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useLocation } from "wouter";

export default function PosTables() {
  const { data: floors, isLoading: isFloorsLoading } = useListFloors();
  const { data: tables, isLoading: isTablesLoading } = useListTables();
  const [activeFloorId, setActiveFloorId] = useState<string>("");
  const [, setLocation] = useLocation();

  if (floors?.length && !activeFloorId) {
    setActiveFloorId(floors[0].id.toString());
  }

  const selectTable = (tableId: number) => {
    localStorage.setItem("pos_table_id", tableId.toString());
    localStorage.removeItem("pos_order_id"); // Clear current order to start fresh on new table
    setLocation("/pos/order");
  };

  return (
    <PosLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Floor Plan</h1>
            <p className="text-muted-foreground mt-1">Select a table to start an order.</p>
          </div>
        </div>

        <div className="flex-1 min-h-0 bg-card rounded-xl border border-border shadow-sm p-6 overflow-y-auto">
          {isFloorsLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-12 w-[300px]" />
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-6">
                {Array(10).fill(0).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-2xl" />
                ))}
              </div>
            </div>
          ) : floors?.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <LayoutGrid className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg font-medium text-foreground">No floors configured</p>
              <p>Please setup the floor plan in the Admin section.</p>
            </div>
          ) : (
            <Tabs value={activeFloorId} onValueChange={setActiveFloorId} className="w-full h-full flex flex-col">
              <TabsList className="bg-transparent h-auto p-0 border-b border-border w-full justify-start rounded-none mb-6">
                {floors?.map(floor => (
                  <TabsTrigger 
                    key={floor.id} 
                    value={floor.id.toString()}
                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-6 py-3 text-base"
                  >
                    {floor.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {floors?.map(floor => {
                const floorTables = tables?.filter(t => t.floorId === floor.id && t.active) || [];
                
                return (
                  <TabsContent key={floor.id} value={floor.id.toString()} className="flex-1 outline-none mt-0">
                    {isTablesLoading ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {Array(8).fill(0).map((_, i) => (
                          <Skeleton key={i} className="aspect-square rounded-2xl" />
                        ))}
                      </div>
                    ) : floorTables.length === 0 ? (
                      <div className="h-48 flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl border-border">
                        No tables on this floor.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {floorTables.map(table => (
                          <button
                            key={table.id}
                            onClick={() => selectTable(table.id)}
                            className={cn(
                              "relative aspect-square rounded-2xl flex flex-col items-center justify-center p-4 transition-all shadow-sm group",
                              table.hasActiveOrder 
                                ? "bg-amber-100 border-2 border-amber-300 text-amber-900 hover:bg-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.2)]" 
                                : "bg-card border-2 border-border hover:border-primary hover:shadow-md"
                            )}
                          >
                            <span className={cn(
                              "text-4xl font-bold font-mono transition-transform group-hover:scale-110",
                              table.hasActiveOrder ? "text-amber-800" : "text-foreground"
                            )}>
                              T{table.number}
                            </span>
                            <span className={cn(
                              "text-sm flex items-center gap-1 mt-2",
                              table.hasActiveOrder ? "text-amber-700/80" : "text-muted-foreground"
                            )}>
                              <Users className="w-4 h-4" /> {table.seats}
                            </span>
                            
                            {table.hasActiveOrder && (
                              <Badge variant="secondary" className="absolute -top-3 -right-3 bg-amber-500 hover:bg-amber-600 text-white border-none shadow-md text-xs px-2.5 py-1">
                                Occupied
                              </Badge>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </div>
      </div>
    </PosLayout>
  );
}