import { NavLink } from 'react-router-dom'
import { FiHome, FiPackage, FiShoppingCart, FiClock, FiBarChart2, FiFileText, FiSettings, FiAlertTriangle } from 'react-icons/fi'

const navItems = [
  { to: '/', label: 'Dashboard', icon: FiHome },
  { to: '/products', label: 'Products', icon: FiPackage },
  { to: '/sales/new', label: 'Sales & Services', icon: FiShoppingCart },
  { to: '/sales/history', label: 'Sales History', icon: FiClock },
  { to: '/reports', label: 'Reports', icon: FiBarChart2 },
  { to: '/damages', label: 'Damaged Products', icon: FiAlertTriangle },
  { to: '/services/billing', label: 'Service Billing', icon: FiFileText },
  { to: '/settings', label: 'Settings', icon: FiSettings },
]

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-72 flex-col border-r border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 lg:flex">
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-400">Stall Manager</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Modern POS</h2>
      </div>
      <nav className="space-y-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-slate-900 text-white shadow-lg dark:bg-slate-800' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900'}`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-auto rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 p-4 text-white shadow-xl">
        <p className="text-sm font-medium">Single owner workflow</p>
        <p className="mt-1 text-sm text-indigo-100">Created By Bejohn</p>
      </div>
    </aside>
  )
}
