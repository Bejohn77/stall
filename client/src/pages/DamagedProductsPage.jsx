import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { FiAlertTriangle, FiDownload, FiPrinter, FiSearch, FiTrash2 } from 'react-icons/fi'
import Topbar from '../components/Topbar'
import api from '../services/api'
import { getFallbackData } from '../services/fallbackData'
import { formatCurrency, formatDate } from '../utils/formatters'

const damageReasons = ['Broken', 'Expired', 'Water Damage', 'Customer Return', 'Lost', 'Other']

export default function DamagedProductsPage() {
  const [products, setProducts] = useState([])
  const [damages, setDamages] = useState([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [reason, setReason] = useState('Broken')
  const [notes, setNotes] = useState('')
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [productFilter, setProductFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [{ data: productData }, { data: damageData }] = await Promise.all([
        api.get('/products').catch((error) => {
          const fallback = getFallbackData('/products')
          if (fallback) {
            return { data: fallback }
          }
          throw error
        }),
        api.get('/damages').catch((error) => {
          const fallback = getFallbackData('/damages')
          if (fallback) {
            return { data: fallback }
          }
          throw error
        }),
      ])

      const normalizedProducts = Array.isArray(productData) ? productData : []
      const normalizedDamages = Array.isArray(damageData) ? damageData : []

      setProducts(normalizedProducts)
      setDamages(normalizedDamages)

      if (!selectedProductId && normalizedProducts.length) {
        setSelectedProductId(normalizedProducts[0]._id)
      }
      if (!normalizedProducts.length) {
        setSelectedProductId('')
      }
    } catch (error) {
      console.error('Failed to load damage data', error)
      setProducts([])
      setDamages([])
      toast.error(error?.response?.data?.message || 'Could not load damage data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const selectedProduct = useMemo(() => products.find((product) => product._id === selectedProductId), [products, selectedProductId])

  const filteredDamages = useMemo(() => {
    return damages.filter((damage) => {
      const matchesSearch = !search || `${damage.productName} ${damage.reason} ${damage.notes}`.toLowerCase().includes(search.toLowerCase())
      const matchesDate = !dateFilter || new Date(damage.createdAt).toISOString().slice(0, 10) === dateFilter
      const matchesProduct = !productFilter || `${damage.productName}`.toLowerCase().includes(productFilter.toLowerCase())
      return matchesSearch && matchesDate && matchesProduct
    })
  }, [damages, search, dateFilter, productFilter])

  const handleSave = async () => {
    if (!selectedProduct) return toast.error('Select a product first')
    const damageQuantity = Number(quantity || 0)
    if (damageQuantity <= 0) return toast.error('Damage quantity must be greater than zero')
    if (selectedProduct.stockQuantity < damageQuantity) return toast.error('Not enough stock to record this damage')

    setSaving(true)
    try {
      await api.post('/damages', {
        productId: selectedProduct._id,
        quantity: damageQuantity,
        reason,
        notes,
      })
      toast.success('Damage record saved')
      setQuantity(1)
      setReason('Broken')
      setNotes('')
      await fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save damage')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (damage) => {
    if (!window.confirm(`Delete this damage record and restore stock for ${damage.productName}?`)) return
    try {
      await api.delete(`/damages/${damage._id}`)
      toast.success('Damage record deleted')
      await fetchData()
    } catch {
      toast.error('Failed to delete damage record')
    }
  }

  const exportCsv = () => {
    const rows = [['Date', 'Product', 'Quantity', 'Cost Price', 'Total Loss', 'Reason', 'Notes']]
    filteredDamages.forEach((damage) => rows.push([formatDate(damage.createdAt), damage.productName, damage.quantity, damage.costPrice, damage.totalLoss, damage.reason, damage.notes]))
    const csv = rows.map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'damages.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Topbar title="Damaged Products" subtitle="Track damaged stock and financial loss" />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 flex items-center gap-2">
            <FiAlertTriangle className="text-amber-500" />
            <h3 className="text-lg font-semibold">Record Damage</h3>
          </div>
          <div className="space-y-4">
            <label className="block text-sm font-medium">
              Product
              <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                {products.map((product) => (
                  <option key={product._id} value={product._id}>{product.name} ({product.stockQuantity} left)</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Damaged quantity
              <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900" />
            </label>
            <label className="block text-sm font-medium">
              Damage reason
              <select value={reason} onChange={(e) => setReason(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                {damageReasons.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Notes (optional)
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900" />
            </label>
            <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              <p><strong>Date:</strong> {new Date().toLocaleString('en-BD')}</p>
              {selectedProduct && <p><strong>Cost price:</strong> {formatCurrency(selectedProduct.buyingPrice)}</p>}
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full rounded-2xl bg-amber-600 px-4 py-3 font-semibold text-white hover:bg-amber-700 disabled:opacity-70">
              {saving ? 'Saving...' : 'Save Damage Record'}
            </button>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Damage History</h3>
              <p className="text-sm text-slate-500">Search and manage recorded damages</p>
            </div>
            <button onClick={exportCsv} className="flex items-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-sm">
              <FiDownload /> Export CSV
            </button>
          </div>
          <div className="mb-4 flex flex-col gap-3 md:flex-row">
            <label className="flex flex-1 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              <FiSearch />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reason or notes" className="w-full border-0 bg-transparent outline-none" />
            </label>
            <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900" />
            <input value={productFilter} onChange={(e) => setProductFilter(e.target.value)} placeholder="Filter product" className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900" />
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-16 animate-pulse rounded-[20px] bg-slate-200 dark:bg-slate-800" />)}
            </div>
          ) : filteredDamages.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              No damage records yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-3">Date</th>
                    <th className="py-3">Product</th>
                    <th className="py-3">Qty</th>
                    <th className="py-3">Cost</th>
                    <th className="py-3">Loss</th>
                    <th className="py-3">Reason</th>
                    <th className="py-3">Notes</th>
                    <th className="py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDamages.map((damage) => (
                    <tr key={damage._id} className="border-t border-slate-200 dark:border-slate-800">
                      <td className="py-3">{formatDate(damage.createdAt)}</td>
                      <td className="py-3">{damage.productName}</td>
                      <td className="py-3">{damage.quantity}</td>
                      <td className="py-3">{formatCurrency(damage.costPrice || 0)}</td>
                      <td className="py-3">{formatCurrency(damage.totalLoss || 0)}</td>
                      <td className="py-3">{damage.reason}</td>
                      <td className="py-3">{damage.notes || '—'}</td>
                      <td className="py-3">
                        <button onClick={() => handleDelete(damage)} className="rounded-2xl bg-rose-100 p-2 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300"><FiTrash2 /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
