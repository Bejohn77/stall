import { Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/ProductsPage'
import NewSalePage from './pages/NewSalePage'
import SalesHistoryPage from './pages/SalesHistoryPage'
import ReportsPage from './pages/ReportsPage'
import DamagedProductsPage from './pages/DamagedProductsPage'
import ServiceBillingPage from './pages/ServiceBillingPage'
import SettingsPage from './pages/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}> 
        <Route path="/" element={<DashboardPage />} />
        <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
        <Route path="/sales/new" element={<NewSalePage />} />
        <Route path="/sales/history" element={<SalesHistoryPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/damages" element={<DamagedProductsPage />} />
        <Route path="/services/billing" element={<NewSalePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
