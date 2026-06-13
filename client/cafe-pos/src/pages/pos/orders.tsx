import { PosLayout } from "@/components/layout/pos-layout";
import { useListOrders, getListOrdersQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, FileText } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function PosOrders() {
  const [search, setSearch] = useState("");
  const sessionId = localStorage.getItem("pos_session_id") ? parseInt(localStorage.getItem("pos_session_id") as string) : undefined;
  
  const { data: orders, isLoading } = useListOrders(
    { sessionId, search },
    { query: { queryKey: [...getListOrdersQueryKey(), search, sessionId], enabled: !!sessionId } }
  );

  return (
    <PosLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Orders</h1>
            <p className="text-muted-foreground mt-1">View all orders for the current session.</p>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm flex flex-col flex-1 min-h-0">
          <div className="p-4 border-b border-border bg-muted/20 shrink-0">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order number or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
          </div>
          
          <div className="overflow-y-auto flex-1">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10 shadow-[0_1px_0_0_hsl(var(--border))]">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Order No.</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Table</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right pr-6">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(8).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="pl-6"><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell className="pr-6"><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : orders?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="h-12 w-12 mb-4 opacity-20" />
                        <p>No orders found in this session.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders?.map((order) => (
                    <TableRow key={order.id} className="cursor-pointer hover:bg-muted/30">
                      <TableCell className="pl-6 font-mono font-medium text-primary">
                        {order.number}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(order.createdAt), "h:mm a")}
                      </TableCell>
                      <TableCell>
                        {order.tableNumber ? <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">T{order.tableNumber}</span> : "-"}
                      </TableCell>
                      <TableCell>
                        {order.customerName || <span className="text-muted-foreground italic">Walk-in</span>}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={
                            order.status === "Paid" ? "text-green-600 border-green-600/30 bg-green-50/50" : 
                            order.status === "Draft" ? "text-amber-600 border-amber-600/30 bg-amber-50/50" : 
                            "text-muted-foreground"
                          }
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6 font-mono font-bold">
                        ${order.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </PosLayout>
  );
}