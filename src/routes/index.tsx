import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/views/components/layout/AppShell';
import { ProtectedRoute } from './ProtectedRoute';
import { ErrorBoundary } from '@/views/components/layout/ErrorBoundary';
import { NotFoundPage } from '@/views/pages/NotFoundPage';
import { LoginPage } from '@/views/pages/LoginPage';

// Route-level code splitting with React.lazy
const DashboardPage = lazy(() =>
  import('@/views/pages/DashboardPage').then(m => ({ default: m.DashboardPage }))
);
const ShipmentsPage = lazy(() =>
  import('@/views/pages/ShipmentsPage').then(m => ({ default: m.ShipmentsPage }))
);
const WeightProformaPage = lazy(() =>
  import('@/views/pages/WeightProformaPage').then(m => ({ default: m.WeightProformaPage }))
);
const ProformaPage = lazy(() =>
  import('@/views/pages/ProformaPage').then(m => ({ default: m.ProformaPage }))
);
const LedgerPage = lazy(() =>
  import('@/views/pages/LedgerPage').then(m => ({ default: m.LedgerPage }))
);
const AlertsPage = lazy(() =>
  import('@/views/pages/AlertsPage').then(m => ({ default: m.AlertsPage }))
);
const ReportsPage = lazy(() =>
  import('@/views/pages/ReportsPage').then(m => ({ default: m.ReportsPage }))
);
const UsersPage = lazy(() =>
  import('@/views/pages/UsersPage').then(m => ({ default: m.UsersPage }))
);
const CartonsPage = lazy(() =>
  import('@/views/pages/CartonsPage').then(m => ({ default: m.CartonsPage }))
);
const InvoicesPage = lazy(() =>
  import('@/views/pages/InvoicesPage').then(m => ({ default: m.InvoicesPage }))
);
const ExpensesPage = lazy(() =>
  import('@/views/pages/ExpensesPage').then(m => ({ default: m.ExpensesPage }))
);

const PageFallback = () => (
  <div className="py-20 flex flex-col items-center justify-center gap-3">
    <div className="w-8 h-8 border-2 border-[#292929] border-t-[#F21624] rounded-full animate-spin"></div>
    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
      Loading Module...
    </span>
  </div>
);

export const AppRoutes: React.FC = () => {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute pageKey="dashboard">
                <Suspense fallback={<PageFallback />}>
                  <DashboardPage />
                </Suspense>
              </ProtectedRoute>
            }
          />

          <Route
            path="/shipments"
            element={
              <ProtectedRoute pageKey="shipments">
                <Suspense fallback={<PageFallback />}>
                  <ShipmentsPage />
                </Suspense>
              </ProtectedRoute>
            }
          />

          <Route
            path="/weightproforma"
            element={
              <ProtectedRoute pageKey="weightproforma">
                <Suspense fallback={<PageFallback />}>
                  <WeightProformaPage />
                </Suspense>
              </ProtectedRoute>
            }
          />

          <Route
  path="/proforma"
  element={
    <ProtectedRoute pageKey="invoice-proforma">
      <Suspense fallback={<PageFallback />}>
        <ProformaPage />
      </Suspense>
    </ProtectedRoute>
  }
/>

          <Route
            path="/ledger"
            element={
              <ProtectedRoute pageKey="ledger">
                <Suspense fallback={<PageFallback />}>
                  <LedgerPage />
                </Suspense>
              </ProtectedRoute>
            }
          />

          {/* Payments — uses the same permission as the Ledger page */}
          <Route
            path="/invoices"
            element={
              <ProtectedRoute pageKey="ledger">
                <Suspense fallback={<PageFallback />}>
                  <InvoicesPage />
                </Suspense>
              </ProtectedRoute>
            }
          />

          <Route
            path="/alerts"
            element={
              <ProtectedRoute pageKey="alerts">
                <Suspense fallback={<PageFallback />}>
                  <AlertsPage />
                </Suspense>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute pageKey="reports">
                <Suspense fallback={<PageFallback />}>
                  <ReportsPage />
                </Suspense>
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute pageKey="users-management">
                <Suspense fallback={<PageFallback />}>
                  <UsersPage />
                </Suspense>
              </ProtectedRoute>
            }
          />

          <Route
            path="/cartons"
            element={
              <ProtectedRoute pageKey="cartons">
                <Suspense fallback={<PageFallback />}>
                  <CartonsPage />
                </Suspense>
              </ProtectedRoute>
            }
          />

          <Route
            path="/expenses"
            element={
              <ProtectedRoute pageKey="expenses">
                <Suspense fallback={<PageFallback />}>
                  <ExpensesPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
};
