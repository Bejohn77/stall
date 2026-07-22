import { useEffect, useState } from 'react'
import { FiPackage, FiTrendingUp, FiDollarSign, FiAlertTriangle } from 'react-icons/fi'
import { BarChart, Bar, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Topbar from '../components/Topbar'
import StatCard from '../components/StatCard'
import api from '../services/api'
import { formatCurrency, formatDate } from '../utils/formatters'

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard').then(({ data }) => setDashboard(data)).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Topbar title="Dashboard" subtitle="Overview of your stall performance" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-[24px] bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    )
  }

  if (!dashboard) return null

  return (
    <div className="space-y-6">
      <Topbar title="Dashboard" subtitle="Overview of your stall performance" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Today's Sales" value={formatCurrency(dashboard.todaySales)} hint="Live sales from today" accent="indigo" />
        <StatCard label="Today's Profit" value={formatCurrency(dashboard.todayProfit)} hint="Net gain from today's sales" accent="emerald" />
        <StatCard label="Monthly Sales" value={formatCurrency(dashboard.monthlySales)} hint="Sales from this month" accent="amber" />
        <StatCard label="Monthly Profit" value={formatCurrency(dashboard.monthlyProfit)} hint="Profit from this month" accent="emerald" />
        <StatCard label="Total Products" value={dashboard.totalProducts} hint="Registered inventory" accent="indigo" />
        <StatCard label="Low Stock" value={dashboard.lowStockProducts} hint="Products that need restocking" accent="rose" />
        <StatCard label="Today's Damaged Items" value={dashboard.damageStats?.todayDamagedItems || 0} hint="Items recorded damaged today" accent="amber" />
        <StatCard label="Damage Cost Today" value={formatCurrency(dashboard.damageStats?.todayDamageCost || 0)} hint="Loss recorded today" accent="rose" />
        <StatCard label="Monthly Damage Cost" value={formatCurrency(dashboard.damageStats?.monthlyDamageCost || 0)} hint="Loss recorded this month" accent="amber" />
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Today's Service Activity</h3>
            <p className="text-sm text-slate-500">Service work tracked from owner-defined services</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[20px] bg-slate-50 p-4 dark:bg-slate-900"><p className="text-sm text-slate-500">Service Revenue</p><p className="mt-2 text-xl font-semibold">{formatCurrency(dashboard.serviceStats?.totalServiceRevenue || 0)}</p></div>
          <div className="rounded-[20px] bg-slate-50 p-4 dark:bg-slate-900"><p className="text-sm text-slate-500">Service Bills</p><p className="mt-2 text-xl font-semibold">{dashboard.serviceStats?.serviceBillCount || 0}</p></div>
          <div className="rounded-[20px] bg-slate-50 p-4 dark:bg-slate-900"><p className="text-sm text-slate-500">Service Items</p><p className="mt-2 text-xl font-semibold">{dashboard.serviceStats?.serviceItemCount || 0}</p></div>
          <div className="rounded-[20px] bg-slate-50 p-4 dark:bg-slate-900"><p className="text-sm text-slate-500">Most Used</p><p className="mt-2 text-xl font-semibold">{dashboard.serviceStats?.mostUsedService || '—'}</p></div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Revenue & Profit</h3>
              <p className="text-sm text-slate-500">Performance and profitability trends</p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <FiTrendingUp />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboard.revenueChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} />
              <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Recent Sales</h3>
              <p className="text-sm text-slate-500">Latest transactions</p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <FiDollarSign />
            </div>
          </div>
          <div className="space-y-3">
            {dashboard.recentSales.map((sale) => (
              <div key={sale._id} className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{sale.invoiceNumber}</p>
                    <p className="text-sm text-slate-500">{sale.paymentMethod}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(sale.grandTotal)}</p>
                    <p className="text-sm text-slate-500">{formatDate(sale.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Daily Sales</h3>
              <p className="text-sm text-slate-500">Your sales trend across the week</p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <FiPackage />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dashboard.dailySalesChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sales" fill="#6366f1" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Low Stock Products</h3>
              <p className="text-sm text-slate-500">Inventory items needing attention</p>
            </div>
            <div className="rounded-2xl bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
              <FiAlertTriangle />
            </div>
          </div>
          <div className="space-y-3">
            {dashboard.lowStockItems.map((item) => (
              <div key={item._id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-slate-500">{item.category}</p>
                </div>
                <span className="rounded-full bg-rose-100 px-3 py-1 text-sm font-medium text-rose-600 dark:bg-rose-900/40 dark:text-rose-300">{item.stockQuantity} left</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
