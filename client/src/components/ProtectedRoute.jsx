import { useEffect, useState } from 'react'
import { FiLock } from 'react-icons/fi'
import toast from 'react-hot-toast'

const STORAGE_KEY = 'stall-products-access'
const DEFAULT_PASSWORD = import.meta.env.VITE_PRODUCTS_PASSWORD || 'stall2026'

export default function ProtectedRoute({ children }) {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  })

  useEffect(() => {
    if (isAuthenticated) {
      window.localStorage.setItem(STORAGE_KEY, 'true')
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [isAuthenticated])

  const handleSubmit = (event) => {
    event.preventDefault()

    if (password === DEFAULT_PASSWORD) {
      setIsAuthenticated(true)
      setPassword('')
      toast.success('Access granted')
      return
    }

    toast.error('Incorrect password')
    setPassword('')
  }

  if (isAuthenticated) {
    return children
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-slate-900 p-3 text-white dark:bg-slate-800">
            <FiLock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Protected area</h2>
            <p className="text-sm text-slate-500">Enter the password to view products</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none dark:border-slate-800 dark:bg-slate-900"
            autoFocus
          />
          <button
            type="submit"
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-medium text-white dark:bg-slate-800"
          >
            Unlock page
          </button>
        </form>
      </div>
    </div>
  )
}
