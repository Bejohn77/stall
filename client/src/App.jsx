import { Routes, Route, useLocation } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/ProductsPage'
import NewSalePage from './pages/NewSalePage'
import SalesHistoryPage from './pages/SalesHistoryPage'
import ReportsPage from './pages/ReportsPage'
import DamagedProductsPage from './pages/DamagedProductsPage'
import ServiceBillingPage from './pages/ServiceBillingPage'
import SettingsPage from './pages/SettingsPage'
import MonthlyCostPage from './pages/MonthlyCostPage'
import UserManagementPage from './pages/UserManagementPage'
import LoginPage from './pages/auth/LoginPage'
import ProtectedRoute from './components/ProtectedRoute'
import { useAuth } from './context/AuthContext'
import { Navigate } from 'react-router-dom'

export default function App() {
  const location = useLocation()
  const { user, loading } = useAuth()
  const isAdmin = user?.role === 'admin'
  const isSalesman = user?.role === 'salesman' || user?.role === 'staff'

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-500">Loading session...</div>
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route element={<MainLayout />}>
        <Route path="/" element={user ? (isAdmin ? <DashboardPage /> : <Navigate to="/sales/new" replace />) : <Navigate to="/login" replace />} />
        <Route path="/products" element={isAdmin ? <ProtectedRoute><ProductsPage /></ProtectedRoute> : (user ? <Navigate to="/sales/new" replace /> : <Navigate to="/login" replace />)} />
        <Route path="/sales/new" element={user && (isAdmin || isSalesman) ? <NewSalePage /> : <Navigate to="/login" replace />} />
        <Route path="/sales/history" element={user && (isAdmin || isSalesman) ? <SalesHistoryPage /> : <Navigate to="/login" replace />} />
        <Route path="/reports" element={isAdmin ? <ReportsPage /> : (user ? <Navigate to="/sales/new" replace /> : <Navigate to="/login" replace />)} />
        <Route path="/damages" element={user && (isAdmin || isSalesman) ? <DamagedProductsPage /> : <Navigate to="/login" replace />} />
        <Route path="/services/billing" element={isAdmin ? <ServiceBillingPage /> : (user ? <Navigate to="/sales/new" replace /> : <Navigate to="/login" replace />)} />
        <Route path="/monthly-costs" element={isAdmin ? <MonthlyCostPage /> : (user ? <Navigate to="/sales/new" replace /> : <Navigate to="/login" replace />)} />
        <Route path="/users" element={isAdmin ? <UserManagementPage /> : (user ? <Navigate to="/sales/new" replace /> : <Navigate to="/login" replace />)} />
        <Route path="/settings" element={isAdmin ? <SettingsPage /> : (user ? <Navigate to="/sales/new" replace /> : <Navigate to="/login" replace />)} />
      </Route>
    </Routes>
  )
}
