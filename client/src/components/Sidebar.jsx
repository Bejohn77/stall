import { NavLink } from 'react-router-dom'
import { FiHome, FiPackage, FiShoppingCart, FiClock, FiBarChart2, FiFileText, FiSettings, FiAlertTriangle, FiDollarSign, FiUsers, FiLogOut } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'

const allNavItems = [
  { to: '/', label: 'Dashboard', icon: FiHome, roles: ['admin'] },
  { to: '/products', label: 'Products', icon: FiPackage, roles: ['admin'] },
  { to: '/sales/new', label: 'Sales & Services', icon: FiShoppingCart, roles: ['admin', 'salesman'] },
  { to: '/sales/history', label: 'Sales History', icon: FiClock, roles: ['admin', 'salesman'] },
  { to: '/reports', label: 'Reports', icon: FiBarChart2, roles: ['admin'] },
  { to: '/damages', label: 'Damaged Products', icon: FiAlertTriangle, roles: ['admin', 'salesman'] },
  { to: '/monthly-costs', label: 'Monthly Cost', icon: FiDollarSign, roles: ['admin'] },
  { to: '/users', label: 'User Management', icon: FiUsers, roles: ['admin'] },
  { to: '/settings', label: 'Settings', icon: FiSettings, roles: ['admin'] },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const normalizedRole = user?.role === 'staff' ? 'salesman' : user?.role || 'salesman'
  const navItems = allNavItems.filter((item) => item.roles.includes(normalizedRole))

  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-400">Stall Manager</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Progga computer</h2>
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
      <div className="mt-auto space-y-3">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 p-4 text-white shadow-xl">
          <p className="text-sm font-medium">{user?.fullName || 'User'}</p>
          <p className="mt-1 text-sm capitalize text-indigo-100">{user?.role || 'staff'}</p>
        </div>
        <button onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 dark:border-slate-800 dark:text-slate-300">
          <FiLogOut /> Logout
        </button>
      </div>
    </aside>
  )
}
