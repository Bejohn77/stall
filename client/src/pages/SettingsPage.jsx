import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import Topbar from '../components/Topbar'
import api from '../services/api'

export default function SettingsPage() {
  const [settings, setSettings] = useState(null)
  const { register, handleSubmit, reset } = useForm()

  const fetchSettings = async () => {
    const { data } = await api.get('/settings')
    setSettings(data)
    reset(data)
  }

  useEffect(() => {
    fetchSettings()
  }, [reset])

  const onSubmit = async (values) => {
    try {
      await api.put('/settings', values)
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

  return (
    <div className="space-y-6">
      <Topbar title="Settings" subtitle="Control store preferences and Telegram alerts" />
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
          <input {...register('storeName')} placeholder="Store Name" className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800 dark:bg-slate-900" />
          <input {...register('phone')} placeholder="Phone" className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800 dark:bg-slate-900" />
          <input {...register('address')} placeholder="Address" className="rounded-2xl border border-slate-200 p-3 md:col-span-2 dark:border-slate-800 dark:bg-slate-900" />
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
      </div>
    </div>
  )
}
