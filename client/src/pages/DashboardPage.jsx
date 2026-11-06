import { useEffect, useState } from 'react'
import { FiAlertTriangle, FiArrowDownRight, FiArrowUpRight, FiBox, FiChevronDown, FiChevronUp, FiDollarSign, FiPackage, FiPercent, FiSearch, FiTrendingUp, FiX } from 'react-icons/fi'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import api from '../services/api'
import { formatCurrency, formatDate } from '../utils/formatters'

function MetricCard({ label, value, hint, accent = 'indigo', icon: Icon }) {
  const accentClasses = {
    indigo: { bar: 'from-indigo-500 to-violet-500', icon: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300' },
    emerald: { bar: 'from-emerald-500 to-teal-500', icon: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300' },
    amber: { bar: 'from-amber-500 to-orange-500', icon: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300' },
    rose: { bar: 'from-rose-500 to-pink-500', icon: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300' },
    teal: { bar: 'from-teal-500 to-cyan-500', icon: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300' },
    slate: { bar: 'from-slate-500 to-slate-700', icon: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  }

  const selected = accentClasses[accent] || accentClasses.slate

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950">
      <div className={`mb-4 h-2 w-16 rounded-full bg-gradient-to-r ${selected.bar}`} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
        </div>
        <div className={`rounded-2xl p-3 ${selected.icon}`}>
          <Icon className="text-lg" />
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-400">{hint}</p>
    </div>
  )
}

function ComparisonBadge({ comparison, label }) {
  if (!comparison) return null
  const isPositive = comparison.isPositive
  const classes = isPositive
    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
    : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
  const Icon = isPositive ? FiArrowUpRight : FiArrowDownRight

  return (
    <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-medium ${classes}`}>
      <Icon />
      {comparison.label}
      <span className="text-xs opacity-80">{label}</span>
    </div>
  )
}

function formatPercent(value) {
  const safe = Number(value || 0)
  return `${safe.toFixed(1)}%`
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dueSearch, setDueSearch] = useState('')
  const [dueStatusFilter, setDueStatusFilter] = useState('All')
  const [dueInvoicesExpanded, setDueInvoicesExpanded] = useState(false)
  const [selectedDueInvoice, setSelectedDueInvoice] = useState(null)

  const fetchDashboard = async () => {
    try {
      const { data } = await api.get('/dashboard')
      setDashboard(data)
    } catch (error) {
      console.error('Failed to load dashboard', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboard()
    const intervalId = setInterval(fetchDashboard, 15000)
    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (!selectedDueInvoice || !dashboard?.dueInvoices) return
    const refreshedInvoice = dashboard.dueInvoices.find((invoice) => invoice.invoiceId === selectedDueInvoice.invoiceId)
    setSelectedDueInvoice(refreshedInvoice || null)
  }, [dashboard?.dueInvoices, selectedDueInvoice?.invoiceId])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-[24px] bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    )
  }

  if (!dashboard) return null

  const comparison = dashboard.comparisons || {}
  const dueSummary = dashboard.dueSummary || {}
  const searchTerm = dueSearch.trim().toLowerCase()
  const filteredDueInvoices = (dashboard.dueInvoices || []).filter((invoice) => {
    const matchesSearch = !searchTerm || [
      invoice.invoiceNumber,
      invoice.invoiceId,
      invoice.customerName,
      invoice.customerPhone,
    ].some((value) => String(value || '').toLowerCase().includes(searchTerm))
    const matchesStatus = dueStatusFilter === 'All' || invoice.paymentStatus === dueStatusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-sm dark:border-slate-800">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-indigo-200">Business Overview</p>
            <h2 className="mt-2 text-2xl font-semibold">Stall Management Dashboard</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">Track sales, profit, discounts, costs, inventory, and business growth in one polished control center.</p>
          </div>
          <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-slate-100">
            Live updates every 15s
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Sales" value={formatCurrency(dashboard.totalSales || 0)} hint="Invoice value before collections" accent="indigo" icon={FiDollarSign} />
        <MetricCard label="Total Collected" value={formatCurrency(dashboard.totalCollected || 0)} hint="Payments actually received" accent="emerald" icon={FiTrendingUp} />
        <MetricCard label="Total Outstanding Due" value={formatCurrency(dashboard.totalOutstandingDue || 0)} hint="Unpaid invoice balances" accent="rose" icon={FiAlertTriangle} />
        <MetricCard label="Total Profit" value={formatCurrency(dashboard.totalProfit || 0)} hint="Sales less product cost and discounts" accent="teal" icon={FiBox} />
      </div>

      <section className="overflow-hidden rounded-[24px] border border-rose-200 bg-white shadow-sm dark:border-rose-900/50 dark:bg-slate-950">
        <button
          type="button"
          aria-expanded={dueInvoicesExpanded}
          onClick={() => setDueInvoicesExpanded((expanded) => !expanded)}
          className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left sm:p-5"
        >
          <span>
            <span className="block font-semibold">Monthly Due Invoices</span>
            <span className="mt-1 block text-xs text-slate-500">Current-month invoices with an outstanding balance</span>
          </span>
          <span className="flex items-center gap-4">
            <span className="text-right">
              <span className="block text-xs text-slate-500">Monthly Due Amount</span>
              <span className="font-semibold text-rose-600 dark:text-rose-300">{formatCurrency(dueSummary.totalDueAmount || 0)}</span>
            </span>
            <span className="text-right">
              <span className="block text-xs text-slate-500">Due Invoices</span>
              <span className="font-semibold">{dueSummary.totalDueInvoices || 0}</span>
            </span>
            {dueInvoicesExpanded ? <FiChevronUp aria-hidden="true" /> : <FiChevronDown aria-hidden="true" />}
          </span>
        </button>

        {dueInvoicesExpanded && (
          <div className="border-t border-rose-100 px-4 pb-4 dark:border-rose-900/50 sm:px-5 sm:pb-5">
            <div className="grid grid-cols-2 gap-2 py-3 sm:grid-cols-4">
              {[
                ['Monthly Due Amount', formatCurrency(dueSummary.totalDueAmount || 0)],
                ['Monthly Due Invoice Count', dueSummary.totalDueInvoices || 0],
                ['Monthly Partial Payment Count', dueSummary.partialPaymentInvoices || 0],
                ['Monthly Unpaid Invoice Count', dueSummary.unpaidInvoices || 0],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-rose-50 px-3 py-2 dark:bg-rose-950/30">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{value}</p>
                </div>
              ))}
            </div>

            <div className="mb-2 flex flex-col gap-2 sm:flex-row">
              <label className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                <FiSearch />
                <input value={dueSearch} onChange={(event) => setDueSearch(event.target.value)} placeholder="Search invoice, customer, or phone" className="w-full border-0 bg-transparent outline-none" />
              </label>
              <select value={dueStatusFilter} onChange={(event) => setDueStatusFilter(event.target.value)} aria-label="Filter due invoices by payment status" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm dark:border-slate-800 dark:bg-slate-900">
                <option value="All">All due statuses</option>
                <option value="Partial">Partial</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="text-xs text-slate-500">
                    <th className="py-2 pr-3 font-medium">Invoice Number</th>
                    <th className="py-2 pr-3 font-medium">Customer Name</th>
                    <th className="py-2 pr-3 font-medium">Invoice Date</th>
                    <th className="py-2 pr-3 font-medium">Payment Status</th>
                    <th className="py-2 text-right font-medium">Remaining Due</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDueInvoices.map((invoice) => (
                    <tr key={invoice.invoiceId} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="py-2 pr-3">
                        <button onClick={() => setSelectedDueInvoice(invoice)} className="font-medium text-indigo-600 hover:underline dark:text-indigo-300">{invoice.invoiceNumber}</button>
                      </td>
                      <td className="py-2 pr-3">
                        <button onClick={() => setSelectedDueInvoice(invoice)} className="text-left hover:underline">{invoice.customerName || 'Walk-in customer'}</button>
                      </td>
                      <td className="whitespace-nowrap py-2 pr-3 text-xs">{formatDate(invoice.createdAt)}</td>
                      <td className="py-2 pr-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${invoice.paymentStatus === 'Partial' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'}`}>{invoice.paymentStatus}</span>
                      </td>
                      <td className="whitespace-nowrap py-2 text-right font-semibold text-rose-600 dark:text-rose-300">{formatCurrency(invoice.dueAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredDueInvoices.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500 dark:border-slate-700">
                  {(dashboard.dueInvoices || []).length ? 'No due invoices match your search or filter.' : 'No current-month invoices have an outstanding balance.'}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Today's Sales" value={formatCurrency(dashboard.todaySales)} hint="Net sales from today" accent="indigo" icon={FiDollarSign} />
        <MetricCard label="Today's Profit" value={formatCurrency(dashboard.todayProfit)} hint="Sales minus discounts, costs, and damage" accent="emerald" icon={FiTrendingUp} />
        <MetricCard label="Monthly Sales" value={formatCurrency(dashboard.monthlySales)} hint="Sales recorded this month" accent="amber" icon={FiPackage} />
        <MetricCard label="Net Profit" value={formatCurrency(dashboard.netProfit || 0)} hint="Monthly profit after costs and damage" accent="teal" icon={FiBox} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Today's Discount" value={formatCurrency(dashboard.todayDiscount || 0)} hint="Discounts given today" accent="rose" icon={FiPercent} />
        <MetricCard label="Monthly Discount" value={formatCurrency(dashboard.monthlyDiscount || 0)} hint="Discounts given this month" accent="rose" icon={FiPercent} />
        <MetricCard label="Total Discounts" value={formatCurrency(dashboard.totalDiscounts || 0)} hint="All discounts recorded" accent="amber" icon={FiPercent} />
        <MetricCard label="Profit Margin" value={formatPercent(dashboard.profitMargin || 0)} hint="Monthly profit ratio" accent="indigo" icon={FiTrendingUp} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Today's Discount %" value={formatPercent(dashboard.todayDiscountPercentage || 0)} hint="Today's discount share of sales" accent="amber" icon={FiPercent} />
        <MetricCard label="Monthly Discount %" value={formatPercent(dashboard.monthlyDiscountPercentage || 0)} hint="Monthly discount share of sales" accent="amber" icon={FiPercent} />
        <MetricCard label="Total Products" value={dashboard.totalProducts || 0} hint="Registered inventory items" accent="indigo" icon={FiBox} />
        <MetricCard label="Out of Stock" value={dashboard.outOfStockProducts || 0} hint="Products with zero stock" accent="rose" icon={FiAlertTriangle} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Today's Business Summary</h3>
              <p className="text-sm text-slate-500">A quick snapshot of today’s performance</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              ['Sales', formatCurrency(dashboard.summaryToday?.sales || 0)],
              ['Collected', formatCurrency(dashboard.summaryToday?.collected || 0)],
              ['Outstanding Due', formatCurrency(dashboard.summaryToday?.outstandingDue || 0)],
              ['Profit', formatCurrency(dashboard.summaryToday?.profit || 0)],
              ['Discount', formatCurrency(dashboard.summaryToday?.discount || 0)],
              ['Cost', formatCurrency(dashboard.summaryToday?.cost || 0)],
              ['Damage Cost', formatCurrency(dashboard.summaryToday?.damage || 0)],
              ['Orders', dashboard.summaryToday?.orders || 0],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[20px] bg-slate-50 p-4 dark:bg-slate-900">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Monthly Business Summary</h3>
              <p className="text-sm text-slate-500">A clear view of the current month</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {[
              ['Sales', formatCurrency(dashboard.summaryMonthly?.sales || 0)],
              ['Collected', formatCurrency(dashboard.summaryMonthly?.collected || 0)],
              ['Outstanding Due', formatCurrency(dashboard.summaryMonthly?.outstandingDue || 0)],
              ['Profit', formatCurrency(dashboard.summaryMonthly?.profit || 0)],
              ['Discount', formatCurrency(dashboard.summaryMonthly?.discount || 0)],
              ['Cost', formatCurrency(dashboard.summaryMonthly?.cost || 0)],
              ['Damage Cost', formatCurrency(dashboard.summaryMonthly?.damage || 0)],
              ['Net Profit', formatCurrency(dashboard.summaryMonthly?.netProfit || 0)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[20px] bg-slate-50 p-4 dark:bg-slate-900">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-2 text-xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Today's Orders", value: dashboard.todayOrders || 0, hint: 'Completed orders today', accent: 'indigo' },
          { label: 'Products Sold Today', value: dashboard.productsSoldToday || 0, hint: 'Units sold across the day', accent: 'emerald' },
          { label: 'Total Stock Quantity', value: dashboard.totalStockQuantity || 0, hint: 'Inventory units on hand', accent: 'amber' },
          { label: 'Low Stock Products', value: dashboard.lowStockProducts || 0, hint: 'Items below reorder levels', accent: 'rose' },
        ].map((item) => (
          <MetricCard key={item.label} label={item.label} value={item.value} hint={item.hint} accent={item.accent} icon={FiBox} />
        ))}
      </div>

      <section>
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Stock Summary</h3>
          <p className="text-sm text-slate-500">Current inventory value and expected profit</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Total Stock Items" value={dashboard.totalStockQuantity || 0} hint="Total units currently in stock" accent="amber" icon={FiBox} />
          <MetricCard label="Total Buying Value" value={formatCurrency(dashboard.totalBuyingValue ?? dashboard.inventoryValue ?? 0)} hint="Current stock at buying price" accent="indigo" icon={FiDollarSign} />
          <MetricCard label="Total Selling Value" value={formatCurrency(dashboard.totalSellingValue || 0)} hint="Current stock at selling price" accent="emerald" icon={FiPackage} />
          <MetricCard label="Expected Total Profit" value={formatCurrency(dashboard.expectedTotalProfit || 0)} hint="Selling value minus buying value" accent="teal" icon={FiTrendingUp} />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Revenue & Profit Trend</h3>
              <p className="text-sm text-slate-500">Monthly revenue and profitability</p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <FiTrendingUp />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboard.revenueChart || []}>
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
              <h3 className="text-lg font-semibold">Business Comparisons</h3>
              <p className="text-sm text-slate-500">Today vs yesterday and month vs last month</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              ['Sales', comparison.sales],
              ['Profit', comparison.profit],
              ['Discount', comparison.discount],
              ['Cost', comparison.cost],
              ['Damage', comparison.damage],
            ].map(([label, data]) => (
              <div key={label} className="flex items-center justify-between rounded-[20px] border border-slate-200 p-3 dark:border-slate-800">
                <span className="font-medium">{label}</span>
                <ComparisonBadge comparison={data} label="Today" />
              </div>
            ))}
            <div className="rounded-[20px] border border-slate-200 p-3 dark:border-slate-800">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">This Month vs Last Month</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  ['Sales', comparison.monthly?.sales],
                  ['Profit', comparison.monthly?.profit],
                  ['Discount', comparison.monthly?.discount],
                  ['Cost', comparison.monthly?.cost],
                  ['Damage', comparison.monthly?.damage],
                ].map(([label, data]) => (
                  <ComparisonBadge key={label} comparison={data} label={label} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Analytics Highlights</h3>
              <p className="text-sm text-slate-500">Best-performing products and highest sales</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[20px] bg-slate-50 p-4 dark:bg-slate-900">
              <p className="text-sm text-slate-500">Best Selling Product Today</p>
              <p className="mt-2 text-xl font-semibold">{dashboard.bestSellingProductToday?.name || '—'}</p>
            </div>
            <div className="rounded-[20px] bg-slate-50 p-4 dark:bg-slate-900">
              <p className="text-sm text-slate-500">Best Selling Product This Month</p>
              <p className="mt-2 text-xl font-semibold">{dashboard.bestSellingProductThisMonth?.name || '—'}</p>
            </div>
            <div className="rounded-[20px] bg-slate-50 p-4 dark:bg-slate-900">
              <p className="text-sm text-slate-500">Highest Profit Product</p>
              <p className="mt-2 text-xl font-semibold">{dashboard.highestProfitProduct?.name || '—'}</p>
            </div>
            <div className="rounded-[20px] bg-slate-50 p-4 dark:bg-slate-900">
              <p className="text-sm text-slate-500">Highest Sale Today</p>
              <p className="mt-2 text-xl font-semibold">{dashboard.highestSaleToday ? formatCurrency(dashboard.highestSaleToday.grandTotal) : '—'}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Cost Breakdown</h3>
              <p className="text-sm text-slate-500">Business expenses by category</p>
            </div>
            <div className="rounded-2xl bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
              <FiAlertTriangle />
            </div>
          </div>
          <div className="space-y-3">
            {(dashboard.costBreakdown || []).map((item) => (
              <div key={item.name} className="flex items-center justify-between rounded-[20px] border border-slate-200 p-3 dark:border-slate-800">
                <span className="font-medium">{item.name}</span>
                <span className="font-semibold">{formatCurrency(item.total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Daily Sales Trend</h3>
              <p className="text-sm text-slate-500">Performance across the week</p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <FiPackage />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dashboard.dailySalesChart || []}>
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
              <p className="text-sm text-slate-500">Inventory items that need attention</p>
            </div>
            <div className="rounded-2xl bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
              <FiAlertTriangle />
            </div>
          </div>
          <div className="space-y-3">
            {(dashboard.lowStockItems || []).map((item) => (
              <div key={item._id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-slate-500">{item.category || 'Inventory item'}</p>
                </div>
                <span className="rounded-full bg-rose-100 px-3 py-1 text-sm font-medium text-rose-600 dark:bg-rose-900/40 dark:text-rose-300">
                  {item.stockQuantity} left
                </span>
              </div>
            ))}
            {!dashboard.lowStockItems?.length && (
              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
                No low stock products right now.
              </div>
            )}
          </div>
        </div>
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

      {selectedDueInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" onClick={() => setSelectedDueInvoice(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="due-invoice-title"
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] bg-white p-6 shadow-2xl dark:bg-slate-950"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 id="due-invoice-title" className="text-xl font-semibold">Invoice Details</h3>
                <p className="text-sm text-slate-500">{selectedDueInvoice.invoiceNumber} · ID {selectedDueInvoice.invoiceId}</p>
              </div>
              <button onClick={() => setSelectedDueInvoice(null)} aria-label="Close invoice details" className="rounded-xl border border-slate-200 p-2 dark:border-slate-800"><FiX /></button>
            </div>

            <div className="grid gap-3 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-900 md:grid-cols-2">
              <p><span className="text-slate-500">Customer:</span> {selectedDueInvoice.customerName || 'Walk-in customer'}</p>
              <p><span className="text-slate-500">Phone:</span> {selectedDueInvoice.customerPhone || '—'}</p>
              <p><span className="text-slate-500">Invoice Date:</span> {formatDate(selectedDueInvoice.createdAt)}</p>
              <p><span className="text-slate-500">Payment Status:</span> {selectedDueInvoice.paymentStatus}</p>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead><tr className="text-slate-500"><th className="py-2">Item</th><th className="py-2">Qty</th><th className="py-2">Unit Price</th><th className="py-2">Discount</th><th className="py-2">Tax</th><th className="py-2">Total</th></tr></thead>
                <tbody>
                  {(selectedDueInvoice.items || []).map((item, index) => (
                    <tr key={`${item.productId || item.serviceId || item.name}-${index}`} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="py-2">{item.name || item.description || 'Invoice item'}</td>
                      <td className="py-2">{item.quantity || 0}</td>
                      <td className="py-2">{formatCurrency(item.unitPrice || 0)}</td>
                      <td className="py-2">{formatCurrency(item.discount || 0)}</td>
                      <td className="py-2">{formatCurrency(item.tax || 0)}</td>
                      <td className="py-2">{formatCurrency(item.total || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-5 grid gap-2 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-900 sm:grid-cols-2">
              <p>Subtotal <span className="float-right font-semibold">{formatCurrency(selectedDueInvoice.subtotal)}</span></p>
              <p>Discount <span className="float-right font-semibold">{formatCurrency(selectedDueInvoice.discount)}</span></p>
              <p>Tax <span className="float-right font-semibold">{formatCurrency(selectedDueInvoice.tax)}</span></p>
              <p>Total Invoice Amount <span className="float-right font-semibold">{formatCurrency(selectedDueInvoice.totalAmount)}</span></p>
              <p>Paid Amount <span className="float-right font-semibold">{formatCurrency(selectedDueInvoice.paidAmount)}</span></p>
              <p className="font-semibold text-rose-600 dark:text-rose-300">Remaining Due <span className="float-right">{formatCurrency(selectedDueInvoice.dueAmount)}</span></p>
            </div>

            <div className="mt-5">
              <h4 className="mb-2 font-semibold">Payment Records</h4>
              {(selectedDueInvoice.payments || []).length ? (
                <div className="space-y-2">
                  {selectedDueInvoice.payments.map((payment, index) => (
                    <div key={`${payment.paidAt}-${index}`} className="flex justify-between rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800">
                      <span>{formatDate(payment.paidAt)} · {payment.paymentMethod || 'Cash'}</span>
                      <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-slate-500">No payments recorded for this invoice.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
