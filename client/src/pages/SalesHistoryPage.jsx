import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { FiDownload, FiPrinter, FiSearch, FiTrash2 } from 'react-icons/fi'
import Topbar from '../components/Topbar'
import api from '../services/api'
import { formatCurrency, formatDate } from '../utils/formatters'

export default function SalesHistoryPage() {
  const [sales, setSales] = useState([])
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchSales = async () => {
    setLoading(true)
    const { data } = await api.get('/sales')
    setSales(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchSales()
  }, [])

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const text = `${sale.invoiceNumber} ${sale.customerName || ''} ${sale.paymentMethod || ''} ${(sale.items || []).map((item) => item.name).join(' ')}`.toLowerCase()
      const matchesSearch = text.includes(search.toLowerCase())
      const matchesDate = !dateFilter || sale.createdAt.includes(dateFilter)
      return matchesSearch && matchesDate
    })
  }, [sales, search, dateFilter])

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice and restore stock for any product items?')) return
    try {
      await api.delete(`/sales/${id}`)
      toast.success('Invoice deleted')
      fetchSales()
    } catch {
      toast.error('Failed to delete invoice')
    }
  }

  const buildSummaryData = (mode) => {
    const groups = new Map()

    filteredSales.forEach((sale) => {
      const createdAt = new Date(sale.createdAt)
      const key = mode === 'monthly'
        ? `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`
        : `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}-${String(createdAt.getDate()).padStart(2, '0')}`

      const current = groups.get(key) || {
        key,
        invoices: 0,
        items: 0,
        sales: 0,
        paid: 0,
        due: 0,
      }

      current.invoices += 1
      current.items += (sale.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0)
      current.sales += Number(sale.grandTotal || 0)
      current.paid += Number(sale.paidAmount || 0)
      current.due += Number(sale.dueAmount || 0)

      groups.set(key, current)
    })

    return Array.from(groups.values()).sort((a, b) => a.key.localeCompare(b.key))
  }

  const exportSummary = (mode, format = 'csv') => {
    const rows = buildSummaryData(mode)
    const headers = mode === 'monthly'
      ? ['Month', 'Invoices', 'Items Sold', 'Sales', 'Paid', 'Due']
      : ['Date', 'Invoices', 'Items Sold', 'Sales', 'Paid', 'Due']

    if (format === 'pdf') {
      const printWindow = window.open('', '_blank', 'width=900,height=700')
      if (!printWindow) return toast.error('Please allow pop-ups to print the report')

      const bodyRows = rows.map((row) => `
        <tr>
          <td>${row.key}</td>
          <td>${row.invoices}</td>
          <td>${row.items}</td>
          <td>${formatCurrency(row.sales)}</td>
          <td>${formatCurrency(row.paid)}</td>
          <td>${formatCurrency(row.due)}</td>
        </tr>
      `).join('')

      printWindow.document.write(`<!DOCTYPE html><html><head><title>${mode === 'monthly' ? 'Monthly' : 'Daily'} Sales Summary</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#0f172a}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{padding:10px;border-bottom:1px solid #e2e8f0;text-align:left}h1,p{margin:0 0 8px}</style></head><body><h1>${mode === 'monthly' ? 'Monthly' : 'Daily'} Sales Summary</h1><p>${rows.length ? 'Exported from the current filtered history.' : 'No matching sales found.'}</p><table><thead><tr><th>${headers[0]}</th><th>${headers[1]}</th><th>${headers[2]}</th><th>${headers[3]}</th><th>${headers[4]}</th><th>${headers[5]}</th></tr></thead><tbody>${bodyRows}</tbody></table></body></html>`)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      return
    }

    const escapeValue = (value) => `"${String(value).replace(/"/g, '""')}"`
    const csvRows = [headers, ...rows.map((row) => [row.key, row.invoices, row.items, row.sales, row.paid, row.due])]
    const csv = csvRows.map((row) => row.map(escapeValue).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${mode === 'monthly' ? 'monthly' : 'daily'}-sales-summary.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(`${mode === 'monthly' ? 'Monthly' : 'Daily'} summary exported`)
  }

  const exportSalesList = (format = 'csv') => {
    const headers = ['Invoice', 'Customer', 'Items', 'Total', 'Payment', 'Date']
    const rows = filteredSales.map((sale) => [
      sale.invoiceNumber || '',
      sale.customerName || 'Walk-in customer',
      (sale.items || []).map((item) => `${item.name} ×${item.quantity}`).join(', '),
      Number(sale.grandTotal || 0),
      sale.paymentMethod || '',
      formatDate(sale.createdAt),
    ])

    if (format === 'pdf') {
      const printWindow = window.open('', '_blank', 'width=900,height=700')
      if (!printWindow) return toast.error('Please allow pop-ups to print the report')

      const bodyRows = rows.map((row) => `
        <tr>
          <td>${row[0]}</td>
          <td>${row[1]}</td>
          <td>${row[2]}</td>
          <td>${formatCurrency(row[3])}</td>
          <td>${row[4]}</td>
          <td>${row[5]}</td>
        </tr>
      `).join('')

      printWindow.document.write(`<!DOCTYPE html><html><head><title>Sales History</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#0f172a}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{padding:10px;border-bottom:1px solid #e2e8f0;text-align:left}h1,p{margin:0 0 8px}</style></head><body><h1>Sales History</h1><p>${filteredSales.length ? 'Exported from the current filtered sales history.' : 'No matching sales found.'}</p><table><thead><tr><th>${headers[0]}</th><th>${headers[1]}</th><th>${headers[2]}</th><th>${headers[3]}</th><th>${headers[4]}</th><th>${headers[5]}</th></tr></thead><tbody>${bodyRows}</tbody></table></body></html>`)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      return
    }

    const escapeValue = (value) => `"${String(value).replace(/"/g, '""')}"`
    const csvRows = [headers, ...rows]
    const csv = csvRows.map((row) => row.map(escapeValue).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'sales-history.csv'
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Sales history exported as Excel/CSV')
  }

  const printInvoice = (sale) => {
    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) return toast.error('Please allow pop-ups to print the invoice')

    const rows = (sale.items || []).map((item) => `
      <tr>
        <td>${item.type === 'product' ? 'Product' : 'Service'}</td>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>${formatCurrency(item.unitPrice || 0)}</td>
        <td>${formatCurrency(item.discount || 0)}</td>
        <td>${formatCurrency(item.tax || 0)}</td>
        <td>${formatCurrency(item.total || 0)}</td>
      </tr>
    `).join('')

    printWindow.document.write(`<!DOCTYPE html><html><head><title>${sale.invoiceNumber}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#0f172a}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{padding:10px;border-bottom:1px solid #e2e8f0;text-align:left}h1,p{margin:0 0 8px}</style></head><body><h1>Invoice</h1><p><strong>${sale.invoiceNumber}</strong></p><p>${sale.customerName || 'Walk-in customer'}</p><p>${sale.customerPhone || ''}</p><p>${formatDate(sale.createdAt)}</p><table><thead><tr><th>Type</th><th>Name</th><th>Qty</th><th>Unit</th><th>Discount</th><th>Tax</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table><div><p>Subtotal: ${formatCurrency(sale.subtotal || 0)}</p><p>Discount: ${formatCurrency(sale.discount || 0)}</p><p>Tax: ${formatCurrency(sale.tax || 0)}</p><p>Grand Total: ${formatCurrency(sale.grandTotal || 0)}</p><p>Paid: ${formatCurrency(sale.paidAmount || 0)}</p><p>Due: ${formatCurrency(sale.dueAmount || 0)}</p><p>Change: ${formatCurrency(sale.change || 0)}</p></div></body></html>`)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <div className="space-y-6">
      <Topbar title="Sales History" subtitle="Search and print previous invoices" />
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row">
            <label className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              <FiSearch />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoice, customer, or item" className="w-full border-0 bg-transparent outline-none" />
            </label>
            <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => exportSalesList('csv')} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm">
              <FiDownload /> Export Excel
            </button>
            <button onClick={() => exportSalesList('pdf')} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm">
              <FiPrinter /> Export PDF
            </button>
            <button onClick={() => exportSummary('daily', 'csv')} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm">
              <FiDownload /> Daily CSV
            </button>
            <button onClick={() => exportSummary('monthly', 'csv')} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm">
              <FiDownload /> Monthly CSV
            </button>
            <button onClick={() => exportSummary('daily', 'pdf')} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm">
              <FiPrinter /> Daily PDF
            </button>
            <button onClick={() => exportSummary('monthly', 'pdf')} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm">
              <FiPrinter /> Monthly PDF
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-[20px] bg-slate-200 dark:bg-slate-800" />)}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-3">Invoice</th>
                  <th className="py-3">Items</th>
                  <th className="py-3">Total</th>
                  <th className="py-3">Payment</th>
                  <th className="py-3">Date</th>
                  <th className="py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map((sale) => (
                  <tr key={sale._id} className="border-t border-slate-200 dark:border-slate-800">
                    <td className="py-4 font-semibold">
                      <div>{sale.invoiceNumber}</div>
                      <div className="text-xs text-slate-500">{sale.customerName || 'Walk-in customer'}</div>
                    </td>
                    <td className="py-4">{(sale.items || []).map((item) => `${item.name} ×${item.quantity}`).join(', ')}</td>
                    <td className="py-4">{formatCurrency(sale.grandTotal)}</td>
                    <td className="py-4">{sale.paymentMethod}</td>
                    <td className="py-4">{formatDate(sale.createdAt)}</td>
                    <td className="py-4">
                      <div className="flex gap-2">
                        <button onClick={() => printInvoice(sale)} className="rounded-2xl bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><FiPrinter /></button>
                        <button onClick={() => handleDelete(sale._id)} className="rounded-2xl bg-rose-100 p-2 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300"><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
