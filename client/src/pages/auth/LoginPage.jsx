import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiEye, FiEyeOff, FiLoader, FiLock, FiUser } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [signupForm, setSignupForm] = useState({ fullName: '', username: '', password: '', phone: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const { user, login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/', { replace: true })
  }, [user, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.username.trim() || !form.password.trim()) {
      toast.error('Please enter your username and password')
      return
    }

    setLoading(true)
    try {
      await login({ username: form.username.trim(), password: form.password })
      if (rememberMe) {
        localStorage.setItem('stall_remember', 'true')
      } else {
        localStorage.removeItem('stall_remember')
      }
      toast.success('Welcome back')
      navigate('/', { replace: true })
    } catch (error) {
      toast.error(error.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (event) => {
    event.preventDefault()
    if (!signupForm.fullName.trim() || !signupForm.username.trim() || !signupForm.password.trim()) {
      toast.error('Please fill in your full name, username, and password')
      return
    }

    setLoading(true)
    try {
      const { data } = await api.post('/auth/signup/salesman', {
        fullName: signupForm.fullName.trim(),
        username: signupForm.username.trim(),
        password: signupForm.password,
        phone: signupForm.phone.trim(),
      })
      toast.success(data.message || 'Signup submitted for admin approval')
      setSignupForm({ fullName: '', username: '', password: '', phone: '' })
      setShowSignup(false)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.15),_transparent_55%)] px-4 py-10">
      <div className="w-full max-w-md rounded-[32px] border border-slate-200 bg-white/90 p-8 shadow-2xl backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg">
            <FiLock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold">Stall Manager</h1>
          <p className="mt-2 text-sm text-slate-500">Secure login for Admin and Staff</p>
        </div>

        {!showSignup ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Username
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-900">
                <FiUser className="text-slate-400" />
                <input value={form.username} onChange={(e) => setForm((current) => ({ ...current, username: e.target.value }))} className="w-full border-0 bg-transparent outline-none" placeholder="Enter username" />
              </div>
            </label>

            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
              <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-900">
                <FiLock className="text-slate-400" />
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))} className="w-full border-0 bg-transparent outline-none" placeholder="Enter password" />
                <button type="button" onClick={() => setShowPassword((current) => !current)} className="text-slate-500">
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </label>

            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
              Remember me
            </label>

            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-lg hover:bg-indigo-700 disabled:opacity-70">
              {loading ? <><FiLoader className="animate-spin" /> Logging in...</> : 'Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Full Name
              <input value={signupForm.fullName} onChange={(e) => setSignupForm((current) => ({ ...current, fullName: e.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-900" placeholder="Enter full name" />
            </label>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Username
              <input value={signupForm.username} onChange={(e) => setSignupForm((current) => ({ ...current, username: e.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-900" placeholder="Choose username" />
            </label>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password
              <input type="password" value={signupForm.password} onChange={(e) => setSignupForm((current) => ({ ...current, password: e.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-900" placeholder="Choose password" />
            </label>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Phone (optional)
              <input value={signupForm.phone} onChange={(e) => setSignupForm((current) => ({ ...current, phone: e.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-900" placeholder="Phone number" />
            </label>
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 font-semibold text-white shadow-lg hover:bg-emerald-700 disabled:opacity-70">
              {loading ? <><FiLoader className="animate-spin" /> Processing...</> : 'Request Salesman Access'}
            </button>
          </form>
        )}

        <button type="button" onClick={() => setShowSignup((current) => !current)} className="mt-4 w-full text-sm font-medium text-indigo-600">
          {showSignup ? 'Back to login' : 'Sign up as salesman'}
        </button>

      </div>
    </div>
  )
}
