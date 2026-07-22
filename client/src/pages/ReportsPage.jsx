import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { FiDownload } from 'react-icons/fi'
import Topbar from '../components/Topbar'
import api from '../services/api'
import { formatCurrency } from '../utils/formatters'

const ranges = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'custom', label: 'Custom' },
]

export default function ReportsPage() {
  const [activeRange, setActiveRange] = useState('daily')
  const [report, setReport] = useState(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [damageReport, setDamageReport] = useState(null)
  const [damageStartDate, setDamageStartDate] = useState('')
  const [damageEndDate, setDamageEndDate] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchReport = async (range = activeRange, from = startDate, to = endDate) => {
    setLoading(true)
    const { data } = await api.get(`/reports/${range}${range === 'custom' ? `?from=${from}&to=${to}` : ''}`)
    setReport(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchReport('daily')
  }, [])

  const exportCsv = () => {
    if (!report) return
    const rows = [
      ['Period', 'Sales', 'Profit', 'Products Sold'],
      [report.period, report.summary.sales, report.summary.profit, report.summary.productsSold],
    ]
    const csv = rows.map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeRange}-report.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportPdf = () => {
    window.print()
  }

  const customSearch = () => fetchReport('custom', startDate, endDate)

  const fetchDamageReport = async (from = damageStartDate, to = damageEndDate) => {
    const params = []
    if (from) params.push(`from=${from}`)
    if (to) params.push(`to=${to}`)
    const query = params.length ? `?${params.join('&')}` : ''
    const { data } = await api.get(`/damages/report${query}`)
    setDamageReport(data)
  }

  useEffect(() => {
    fetchDamageReport()
  }, [])

  const exportDamageCsv = () => {
    if (!damageReport) return
    const rows = [['Date', 'Quantity', 'Loss']]
    damageReport.trend.forEach((item) => rows.push([item.name, item.quantity, item.loss]))
    const csv = rows.map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'damage-report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportDamagePdf = () => window.print()

  return (
    <div className="space-y-6">
      <Topbar title="Reports" subtitle="Daily, weekly, monthly and custom reports" />
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-5 flex flex-wrap gap-3">
          {ranges.map((range) => (
            <button key={range.key} onClick={() => { setActiveRange(range.key); fetchReport(range.key); }} className={`rounded-full px-4 py-2 text-sm font-medium ${activeRange === range.key ? 'bg-slate-900 text-white dark:bg-slate-700' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
              {range.label}
            </button>
          ))}
        </div>

        {activeRange === 'custom' && (
          <div className="mb-5 flex flex-col gap-3 md:flex-row">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900" />
            <button onClick={customSearch} className="rounded-2xl bg-indigo-600 px-4 py-2 text-white">Generate</button>
          </div>
        )}

        <div className="mb-5 flex gap-3">
          <button onClick={exportCsv} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm">Export Excel</button>
          <button onClick={exportPdf} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm">Export PDF</button>
        </div>

        {loading ? (
          <div className="h-48 animate-pulse rounded-[24px] bg-slate-200 dark:bg-slate-800" />
        ) : report ? (
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[20px] bg-slate-50 p-4 dark:bg-slate-900"><p className="text-sm text-slate-500">Sales</p><p className="mt-2 text-xl font-semibold">{formatCurrency(report.summary.sales)}</p></div>
              <div className="rounded-[20px] bg-slate-50 p-4 dark:bg-slate-900"><p className="text-sm text-slate-500">Profit</p><p className="mt-2 text-xl font-semibold">{formatCurrency(report.summary.profit)}</p></div>
              <div className="rounded-[20px] bg-slate-50 p-4 dark:bg-slate-900"><p className="text-sm text-slate-500">Products Sold</p><p className="mt-2 text-xl font-semibold">{report.summary.productsSold}</p></div>
            </div>

            <div className="mb-6 rounded-[24px] border border-slate-200 p-4 dark:border-slate-800">
              <h4 className="mb-3 font-semibold">Service Summary</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[20px] bg-slate-50 p-4 dark:bg-slate-900"><p className="text-sm text-slate-500">Service Revenue</p><p className="mt-2 text-xl font-semibold">{formatCurrency(report.serviceSummary?.totalServiceRevenue || 0)}</p></div>
                <div className="rounded-[20px] bg-slate-50 p-4 dark:bg-slate-900"><p className="text-sm text-slate-500">Service Bills</p><p className="mt-2 text-xl font-semibold">{report.serviceSummary?.serviceBillCount || 0}</p></div>
                <div className="rounded-[20px] bg-slate-50 p-4 dark:bg-slate-900"><p className="text-sm text-slate-500">Most Used</p><p className="mt-2 text-xl font-semibold">{report.serviceSummary?.mostUsedService || '—'}</p></div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-[24px] border border-slate-200 p-4 dark:border-slate-800">
                <h4 className="mb-3 font-semibold">Revenue Chart</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={report.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="rounded-[24px] border border-slate-200 p-4 dark:border-slate-800">
                <h4 className="mb-3 font-semibold">Profit Chart</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={report.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="profit" fill="#10b981" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-slate-200 p-4 dark:border-slate-800">
              <h4 className="mb-3 font-semibold">Damage Report</h4>
              <div className="mb-4 flex flex-col gap-3 md:flex-row">
                <input type="date" value={damageStartDate} onChange={(e) => setDamageStartDate(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900" />
                <input type="date" value={damageEndDate} onChange={(e) => setDamageEndDate(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900" />
                <button onClick={() => fetchDamageReport(damageStartDate, damageEndDate)} className="rounded-2xl bg-amber-600 px-4 py-2 text-white">Filter</button>
                <button onClick={exportDamageCsv} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm"><FiDownload /> Export CSV</button>
                <button onClick={exportDamagePdf} className="rounded-2xl border border-slate-200 px-4 py-2 text-sm">Export PDF</button>
              </div>
              <div className="mb-4 grid gap-4 md:grid-cols-4">
                <div className="rounded-[20px] bg-slate-50 p-4 dark:bg-slate-900"><p className="text-sm text-slate-500">Damaged Qty</p><p className="mt-2 text-xl font-semibold">{damageReport?.totalDamagedQuantity || 0}</p></div>
                <div className="rounded-[20px] bg-slate-50 p-4 dark:bg-slate-900"><p className="text-sm text-slate-500">Financial Loss</p><p className="mt-2 text-xl font-semibold">{formatCurrency(damageReport?.totalFinancialLoss || 0)}</p></div>
                <div className="rounded-[20px] bg-slate-50 p-4 dark:bg-slate-900"><p className="text-sm text-slate-500">Most Damaged</p><p className="mt-2 text-xl font-semibold">{damageReport?.mostDamagedProduct || '—'}</p></div>
                <div className="rounded-[20px] bg-slate-50 p-4 dark:bg-slate-900"><p className="text-sm text-slate-500">Trend Days</p><p className="mt-2 text-xl font-semibold">{damageReport?.trend?.length || 0}</p></div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={damageReport?.trend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantity" fill="#f59e0b" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 rounded-[24px] border border-slate-200 p-4 dark:border-slate-800">
              <h4 className="mb-3 font-semibold">Best Selling Products</h4>
              <div className="space-y-2">
                {report.bestProducts.map((product) => (
                  <div key={product._id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 dark:bg-slate-900">
                    <span>{product.name}</span>
                    <span className="font-semibold">{product.quantity} sold</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
