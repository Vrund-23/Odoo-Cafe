import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { setAuthTokenGetter } from "@workspace/api-client-react";

import AuthPage from "@/pages/auth";
import AdminProducts from "@/pages/admin/products";
import AdminCategories from "@/pages/admin/categories";
import AdminPaymentMethods from "@/pages/admin/payment-methods";
import AdminFloors from "@/pages/admin/floors";
import AdminCoupons from "@/pages/admin/coupons";
import AdminUsers from "@/pages/admin/users";
import AdminReports from "@/pages/admin/reports";

import { PosLayout } from "@/components/layout/pos-layout";
import PosOrder from "@/pages/pos/order";
import PosOrders from "@/pages/pos/orders";
import PosCustomers from "@/pages/pos/customers";
import PosTables from "@/pages/pos/tables";

import KdsPage from "@/pages/kds/index";

// Set auth token getter for api client
setAuthTokenGetter(() => localStorage.getItem("pos_token"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        const status = (error as { status?: number })?.status;
        if (status === 401 || status === 403 || status === 404) return false;
        return failureCount < 2;
      },
      staleTime: 30_000,
    },
  },
});

function Home() {
  return <Redirect to="/pos/order" />;
}

function AdminRedirect() {
  return <Redirect to="/admin/products" />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Admin Routes */}
      <Route path="/admin" component={AdminRedirect} />
      <Route path="/admin/dashboard" component={AdminRedirect} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/payment-methods" component={AdminPaymentMethods} />
      <Route path="/admin/floors" component={AdminFloors} />
      <Route path="/admin/coupons" component={AdminCoupons} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/reports" component={AdminReports} />

      {/* POS Routes */}
      <Route path="/pos/order" component={PosOrder} />
      <Route path="/pos/orders" component={PosOrders} />
      <Route path="/pos/customers" component={PosCustomers} />
      <Route path="/pos/tables" component={PosTables} />

      {/* KDS Route */}
      <Route path="/kds" component={KdsPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
        <Sonner richColors position="top-right" />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;