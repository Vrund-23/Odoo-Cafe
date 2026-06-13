import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { useStore } from './lib/store';

// Pages
import AuthPage from './pages/auth.jsx';
import KdsPage from './pages/kds.jsx';
import PosLayout from './pages/pos.jsx';
import PosIndexPage from './pages/pos.index.jsx';
import PosOrdersPage from './pages/pos.orders.jsx';
import PosCustomersPage from './pages/pos.customers.jsx';
import PosTablesPage from './pages/pos.tables.jsx';
import AdminLayout from './pages/admin.jsx';
import AdminProductsPage from './pages/admin.products.jsx';
import AdminCategoriesPage from './pages/admin.categories.jsx';
import AdminPaymentMethodsPage from './pages/admin.payment-methods.jsx';
import AdminCouponsPage from './pages/admin.coupons.jsx';
import AdminBookingPage from './pages/admin.booking.jsx';
import AdminUsersPage from './pages/admin.users.jsx';
import AdminReportsPage from './pages/admin.reports.jsx';

function App() {
  const bootstrap = useStore((s) => s.bootstrap);
  const authToken = useStore((s) => s.authToken);

  useEffect(() => {
    if (authToken) {
      bootstrap();
    }
  }, [authToken, bootstrap]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<AuthPage />} />
        <Route path="/kds" element={<KdsPage />} />

        {/* POS Nested Routes */}
        <Route path="/pos" element={<PosLayout />}>
          <Route index element={<PosIndexPage />} />
          <Route path="orders" element={<PosOrdersPage />} />
          <Route path="customers" element={<PosCustomersPage />} />
          <Route path="tables" element={<PosTablesPage />} />
        </Route>

        {/* Admin Nested Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/reports" replace />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="payment-methods" element={<AdminPaymentMethodsPage />} />
          <Route path="coupons" element={<AdminCouponsPage />} />
          <Route path="booking" element={<AdminBookingPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </BrowserRouter>
  );
}

export default App;
