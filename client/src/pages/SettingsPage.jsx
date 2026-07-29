import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import api from '../services/api'

export default function SettingsPage() {
  const [settings, setSettings] = useState(null)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const fetchSettings = async () => {
    const { data } = await api.get('/settings')
    setSettings(data)
    reset(data)
  }

  useEffect(() => {
    fetchSettings()
  }, [reset])

  const onSubmit = async (values) => {
    const payload = {
      ...values,
      storeName: `${values.storeName || ''}`.trim(),
      phone: `${values.phone || ''}`.trim(),
      address: `${values.address || ''}`.trim(),
    }

    if (!payload.storeName) {
      toast.error('Shop Name is required')
      return
    }

    if (!payload.phone) {
      toast.error('Shop Phone Number is required')
      return
    }

    try {
      await api.put('/settings', payload)
      toast.success('Settings updated')
    } catch {
      toast.error('Failed to update settings')
    }
  }

  const backupData = async () => {
    const { data } = await api.get('/settings/backup')
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'stall-backup.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  const restoreData = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const text = await file.text()
    try {
      await api.post('/settings/restore', JSON.parse(text))
      toast.success('Backup restored')
      fetchSettings()
    } catch {
      toast.error('Could not restore backup')
    }
  }

  const handlePasswordSubmit = async (event) => {
    event.preventDefault()
    const { currentPassword, newPassword, confirmPassword } = passwordForm

    if (!currentPassword.trim()) {
      toast.error('Current password is required')
      return
    }

    if (!newPassword.trim()) {
      toast.error('New password is required')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      toast.error('Password must include at least one letter and one number')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    setPasswordSubmitting(true)
    try {
      const { data } = await api.post('/auth/change-password', { currentPassword, newPassword })
      toast.success(data.message || 'Password changed successfully')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password')
    } finally {
      setPasswordSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Shop Name *</label>
            <input {...register('storeName', { required: 'Shop Name is required', validate: (value) => `${value || ''}`.trim() !== '' || 'Shop Name is required' })} placeholder="Shop Name" className={`w-full rounded-2xl border p-3 dark:border-slate-800 dark:bg-slate-900 ${errors.storeName ? 'border-rose-400' : 'border-slate-200'}`} />
            {errors.storeName ? <p className="mt-1 text-sm text-rose-500">{errors.storeName.message}</p> : null}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Shop Phone Number *</label>
            <input {...register('phone', { required: 'Shop Phone Number is required', validate: (value) => `${value || ''}`.trim() !== '' || 'Shop Phone Number is required' })} placeholder="Shop Phone Number" className={`w-full rounded-2xl border p-3 dark:border-slate-800 dark:bg-slate-900 ${errors.phone ? 'border-rose-400' : 'border-slate-200'}`} />
            {errors.phone ? <p className="mt-1 text-sm text-rose-500">{errors.phone.message}</p> : null}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Shop Address</label>
            <input {...register('address')} placeholder="Shop Address" className="w-full rounded-2xl border border-slate-200 p-3 dark:border-slate-800 dark:bg-slate-900" />
          </div>
          <input {...register('currency')} placeholder="Currency" className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800 dark:bg-slate-900" />
          <select {...register('theme')} className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800 dark:bg-slate-900">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
          <input {...register('telegramBotToken')} placeholder="Telegram Bot Token" className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800 dark:bg-slate-900" />
          <input {...register('telegramChatId')} placeholder="Telegram Chat ID" className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800 dark:bg-slate-900" />
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="rounded-2xl bg-slate-900 px-4 py-2 text-white dark:bg-slate-800">Save Settings</button>
          </div>
        </form>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <button onClick={backupData} className="rounded-[24px] border border-slate-200 p-4 text-left font-medium">Backup Database</button>
          <label className="cursor-pointer rounded-[24px] border border-slate-200 p-4 text-left font-medium">
            Restore Database
            <input type="file" accept="application/json" onChange={restoreData} className="hidden" />
          </label>
        </div>

        <div className="mt-8 rounded-[28px] border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900/60">
          <h2 className="text-lg font-semibold">Change Password</h2>
          <p className="mt-1 text-sm text-slate-500">Use this to change your own password securely.</p>
          <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-3">
            <input type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} placeholder="Current password" className="w-full rounded-2xl border border-slate-200 p-3 dark:border-slate-800 dark:bg-slate-950" />
            <input type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} placeholder="New password" className="w-full rounded-2xl border border-slate-200 p-3 dark:border-slate-800 dark:bg-slate-950" />
            <input type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))} placeholder="Confirm new password" className="w-full rounded-2xl border border-slate-200 p-3 dark:border-slate-800 dark:bg-slate-950" />
            <button type="submit" disabled={passwordSubmitting} className="rounded-2xl bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-70">
              {passwordSubmitting ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
