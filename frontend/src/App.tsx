import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute, PublicOnlyRoute } from './components/layout/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { TransactionDetailPage } from './pages/TransactionDetailPage';
import { ReceiptPage } from './pages/ReceiptPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public-only authentication routes */}
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnlyRoute>
              <SignupPage />
            </PublicOnlyRoute>
          }
        />

        {/* Backward-compatibility redirects for any legacy .html links */}
        <Route path="/login.html" element={<Navigate to="/login" replace />} />
        <Route path="/signup.html" element={<Navigate to="/signup" replace />} />
        <Route path="/dashboard.html" element={<Navigate to="/dashboard" replace />} />
        <Route path="/payment.html" element={<Navigate to="/payments" replace />} />
        <Route path="/pay-qr.html" element={<Navigate to="/payments" replace />} />
        <Route path="/pay-phone.html" element={<Navigate to="/payments" replace />} />
        <Route path="/transactions.html" element={<Navigate to="/transactions" replace />} />
        <Route path="/profile.html" element={<Navigate to="/settings" replace />} />
        <Route path="/balance.html" element={<Navigate to="/settings" replace />} />
        <Route path="/payment-success.html" element={<Navigate to="/receipts" replace />} />
        <Route path="/index.html" element={<Navigate to="/dashboard" replace />} />

        {/* Authenticated Application Shell */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="transactions/:id" element={<TransactionDetailPage />} />
          <Route path="receipts" element={<ReceiptPage />} />
          <Route path="receipts/:id" element={<ReceiptPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<Navigate to="/settings" replace />} />
        </Route>

        {/* Catch-all 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
