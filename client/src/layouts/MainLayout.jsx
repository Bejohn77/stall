import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
