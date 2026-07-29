import { useEffect, useMemo, useState } from 'react'
import { FiPlus, FiTrash2, FiDollarSign, FiCalendar, FiFileText } from 'react-icons/fi'
import api from '../services/api'
import { formatCurrency, formatDate } from '../utils/formatters'

const costOptions = [
  'Shop Rent',
  'Electricity Bill',
  'Water Bill',
  'Internet Bill',
  'Employee Salary',
  'Other Expenses',
]

const initialForm = {
  costName: 'Shop Rent',
  amount: '',
  month: new Date().toISOString().slice(0, 7),
  date: new Date().toISOString().slice(0, 10),
  note: '',
}

export default function MonthlyCostPage() {
  const [costs, setCosts] = useState([])
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

  const loadCosts = async (month = selectedMonth) => {
    setLoading(true)
    try {
      const { data } = await api.get('/monthly-costs', { params: { month } })
      setCosts(data.costs || [])
    } catch (error) {
      console.error('Failed to load monthly costs', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCosts(selectedMonth)
  }, [])

  const totalMonthlyCost = useMemo(() => costs.reduce((sum, cost) => sum + Number(cost.amount || 0), 0), [costs])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)

    try {
      await api.post('/monthly-costs', {
        ...form,
        amount: Number(form.amount || 0),
      })
      setForm({ ...initialForm, month: form.month, date: form.date })
      await loadCosts(selectedMonth)
    } catch (error) {
      console.error('Failed to save monthly cost', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/monthly-costs/${id}`)
      await loadCosts(selectedMonth)
    } catch (error) {
      console.error('Failed to delete monthly cost', error)
    }
  }

  const handleMonthChange = (event) => {
    const month = event.target.value
    setSelectedMonth(month)
    loadCosts(month)
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Add Monthly Cost</h3>
              <p className="text-sm text-slate-500">Capture expenses for the selected month</p>
            </div>
            <div className="rounded-2xl bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
              <FiPlus />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                Cost Name
                <select
                  value={form.costName}
                  onChange={(event) => setForm({ ...form, costName: event.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
                  required
                >
                  {costOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                Amount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) => setForm({ ...form, amount: event.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
                  placeholder="0.00"
                  required
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                Month
                <input
                  type="month"
                  value={form.month}
                  onChange={(event) => setForm({ ...form, month: event.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
                  required
                />
              </label>

              <label className="space-y-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                Date
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm({ ...form, date: event.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
                  required
                />
              </label>
            </div>

            <label className="space-y-1 text-sm font-medium text-slate-700 dark:text-slate-300">
              Note (Optional)
              <textarea
                value={form.note}
                onChange={(event) => setForm({ ...form, note: event.target.value })}
                rows="3"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 dark:border-slate-800 dark:bg-slate-900"
                placeholder="Add any note for this expense"
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              {saving ? 'Saving...' : 'Save Monthly Cost'}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Monthly Cost Summary</h3>
                <p className="text-sm text-slate-500">Total spend for the selected month</p>
              </div>
              <div className="rounded-2xl bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
                <FiDollarSign />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-slate-50 p-4 dark:bg-slate-900">
              <div>
                <p className="text-sm text-slate-500">Total Monthly Cost</p>
                <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-white">{formatCurrency(totalMonthlyCost)}</p>
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                <FiCalendar />
                <input type="month" value={selectedMonth} onChange={handleMonthChange} className="bg-transparent outline-none" />
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Monthly Cost List</h3>
                <p className="text-sm text-slate-500">All recorded business expenses</p>
              </div>
              <div className="rounded-2xl bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <FiFileText />
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />
                ))}
              </div>
            ) : costs.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">No costs recorded for this month yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                      <th className="px-2 py-3">Name</th>
                      <th className="px-2 py-3">Amount</th>
                      <th className="px-2 py-3">Date</th>
                      <th className="px-2 py-3">Note</th>
                      <th className="px-2 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costs.map((cost) => (
                      <tr key={cost._id} className="border-b border-slate-100 text-slate-700 dark:border-slate-900 dark:text-slate-300">
                        <td className="px-2 py-3 font-medium">{cost.costName}</td>
                        <td className="px-2 py-3">{formatCurrency(cost.amount)}</td>
                        <td className="px-2 py-3">{formatDate(cost.date)}</td>
                        <td className="px-2 py-3">{cost.note || '—'}</td>
                        <td className="px-2 py-3">
                          <button onClick={() => handleDelete(cost._id)} className="rounded-xl p-2 text-rose-500 transition hover:bg-rose-50 dark:hover:bg-rose-900/30">
                            <FiTrash2 />
                          </button>
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
    </div>
  )
}
