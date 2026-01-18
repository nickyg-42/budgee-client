import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./theme/ThemeContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Dashboard } from "./pages/Dashboard";
import { Transactions } from "./pages/Transactions";
import { Accounts } from "./pages/Accounts";
import { Profile } from "./pages/Profile";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Budgets } from "./pages/Budgets";
import { Toaster } from 'sonner';
import { TransactionRules } from "./pages/TransactionRules";
import { AdminDashboard } from "./pages/AdminDashboard";
import { SuperAdminRoute } from "./components/SuperAdminRoute";

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/transactions" element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            } />
            <Route path="/accounts" element={
              <ProtectedRoute>
                <Accounts />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/budgets" element={
              <ProtectedRoute>
                <Budgets />
              </ProtectedRoute>
            } />
            <Route path="/transaction-rules" element={
              <ProtectedRoute>
                <TransactionRules />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <SuperAdminRoute>
                <AdminDashboard />
              </SuperAdminRoute>
            } />
          
          {/* Redirect unknown routes to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster position="top-right" duration={1500} />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}
