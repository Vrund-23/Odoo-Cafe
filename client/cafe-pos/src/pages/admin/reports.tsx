import { AdminLayout } from "@/components/layout/admin-layout";
import { 
  useGetReportSummary, 
  useGetSalesTrend, 
  useGetTopProducts, 
  useGetTopCategories, 
  useGetTopOrders,
  useListUsers,
  useListSessions,
  GetReportSummaryPeriod
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Receipt, TrendingUp, ShoppingCart } from "lucide-react";
import { format } from "date-fns";

export default function AdminReports() {
  const [period, setPeriod] = useState<GetReportSummaryPeriod>("today");
  const [employeeId, setEmployeeId] = useState<string>("all");
  const [sessionId, setSessionId] = useState<string>("all");

  const { data: users } = useListUsers();
  const { data: sessions } = useListSessions();

  const queryParams = {
    query: {
      queryKey: ["reports", period, employeeId, sessionId],
    }
  };

  const getParams = () => ({
    period,
    employeeId: employeeId !== "all" ? parseInt(employeeId) : undefined,
    sessionId: sessionId !== "all" ? parseInt(sessionId) : undefined,
  });

  const { data: summary, isLoading: loadingSummary } = useGetReportSummary(getParams(), queryParams);
  const { data: trend, isLoading: loadingTrend } = useGetSalesTrend(getParams(), queryParams);
  const { data: topProducts, isLoading: loadingProducts } = useGetTopProducts({ period, limit: 5 }, queryParams);
  const { data: topCategories, isLoading: loadingCategories } = useGetTopCategories({ period, limit: 5 }, queryParams);
  const { data: topOrders, isLoading: loadingOrders } = useGetTopOrders({ period, limit: 5 }, queryParams);

  // Fallback colors for pie chart
  const PIE_COLORS = ["#d97706", "#ea580c", "#f59e0b", "#fbbf24", "#fcd34d"];

  return (
    <AdminLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Reports</h1>
            <p className="text-muted-foreground mt-1">Analytics and performance insights.</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Select value={period} onValueChange={(v) => setPeriod(v as GetReportSummaryPeriod)}>
              <SelectTrigger className="w-[150px] bg-card">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>

            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger className="w-[150px] bg-card">
                <SelectValue placeholder="Employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {users?.filter(u => u.active).map(u => (
                  <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sessionId} onValueChange={setSessionId}>
              <SelectTrigger className="w-[150px] bg-card">
                <SelectValue placeholder="Session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {sessions?.slice(0, 10).map(s => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {format(new Date(s.openedAt), "MMM d, h:mm a")} ({s.employeeName})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <Skeleton className="h-8 w-32 mt-1" />
              ) : (
                <div className="text-3xl font-bold text-foreground">${summary?.revenue.toFixed(2) || "0.00"}</div>
              )}
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
              <Receipt className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <Skeleton className="h-8 w-24 mt-1" />
              ) : (
                <div className="text-3xl font-bold text-foreground">{summary?.totalOrders || 0}</div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Order Value</CardTitle>
              <ShoppingCart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {loadingSummary ? (
                <Skeleton className="h-8 w-24 mt-1" />
              ) : (
                <div className="text-3xl font-bold text-foreground">${summary?.avgOrderValue.toFixed(2) || "0.00"}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTrend ? (
                <Skeleton className="h-[300px] w-full" />
              ) : trend?.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data for selected period</div>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(val) => `$${val}`} />
                      <Tooltip 
                        cursor={{ fill: 'hsl(var(--muted))' }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Sales by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCategories ? (
                <Skeleton className="h-[300px] w-full" />
              ) : topCategories?.length === 0 ? (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data for selected period</div>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topCategories}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="revenue"
                        nameKey="categoryName"
                      >
                        {topCategories?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.categoryColor || PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Revenue']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '20px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Top Products</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Product</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right pr-6">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingProducts ? (
                    Array(3).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="pl-6"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                        <TableCell className="pr-6"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : topProducts?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">No data</TableCell>
                    </TableRow>
                  ) : (
                    topProducts?.map(p => (
                      <TableRow key={p.productId}>
                        <TableCell className="pl-6 font-medium">{p.productName}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{p.qty}</TableCell>
                        <TableCell className="text-right pr-6 font-mono">${p.revenue.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Recent Top Orders</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-6">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingOrders ? (
                    Array(3).fill(0).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell className="pl-6"><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell className="pr-6"><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : topOrders?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">No data</TableCell>
                    </TableRow>
                  ) : (
                    topOrders?.map(o => (
                      <TableRow key={o.id}>
                        <TableCell className="pl-6 font-mono text-xs">{o.number}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{o.customerName || "Guest"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={o.status === "Paid" ? "text-green-600 border-green-600/30 bg-green-50/50" : ""}>
                            {o.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6 font-mono font-medium">${o.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

      </div>
    </AdminLayout>
  );
}