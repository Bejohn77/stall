import { useState } from 'react'
import { FiLock } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../services/api'

export default function ProtectedRoute({ children }) {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!password.trim()) {
      toast.error('Please enter the password')
      return
    }

    try {
      setIsSubmitting(true)
      const { data } = await api.post('/auth/verify-products-password', { password })

      if (data.success) {
        setIsAuthenticated(true)
        setPassword('')
        toast.success('Access granted')
        return
      }

      toast.error('Incorrect password')
      setPassword('')
    } catch (error) {
      toast.error('Could not verify password')
      setPassword('')
    } finally {
      setIsSubmitting(false)
    }
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
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-medium text-white disabled:opacity-70 dark:bg-slate-800"
          >
            {isSubmitting ? 'Checking...' : 'Unlock page'}
          </button>
        </form>
      </div>
    </div>
  )
}
