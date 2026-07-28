import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Topbar from '../components/Topbar'
import api from '../services/api'

const emptyForm = {
  fullName: '',
  username: '',
  password: '',
  phone: '',
  role: 'salesman',
  status: 'active',
}

export default function UserManagementPage() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadUsers = async () => {
    try {
      const { data } = await api.get('/auth/users')
      setUsers(data || [])
    } catch (error) {
      toast.error('Unable to load users')
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.fullName.trim() || !form.username.trim() || (!editingId && !form.password.trim())) {
      toast.error('Please fill in the required fields')
      return
    }

    setLoading(true)
    try {
      const payload = {
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        phone: form.phone.trim(),
        role: form.role,
        status: form.status,
      }

      if (form.password.trim()) payload.password = form.password

      if (editingId) {
        await api.put(`/auth/users/${editingId}`, payload)
        toast.success('User updated')
      } else {
        await api.post('/auth/users', payload)
        toast.success('User created')
      }

      setForm(emptyForm)
      setEditingId(null)
      await loadUsers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (user) => {
    setEditingId(user._id)
    setForm({
      fullName: user.fullName || '',
      username: user.username || '',
      password: '',
      phone: user.phone || '',
      role: user.role || 'salesman',
      status: user.status || 'active',
    })
  }

  const handleResetPassword = async (userId) => {
    const password = window.prompt('Enter new password for this user')
    if (!password || !password.trim()) return

    try {
      await api.post(`/auth/users/${userId}/reset-password`, { password })
      toast.success('Password reset successfully')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password reset failed')
    }
  }

  const toggleStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/auth/users/${userId}`, { status: currentStatus === 'active' ? 'inactive' : 'active' })
      toast.success('User status updated')
      await loadUsers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Status update failed')
    }
  }

  const handleApprove = async (userId) => {
    try {
      await api.put(`/auth/users/${userId}`, { isApproved: true })
      toast.success('User approved')
      await loadUsers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Approval failed')
    }
  }

  const handleDelete = async (userId) => {
    if (!window.confirm('Delete this user?')) return
    try {
      await api.delete(`/auth/users/${userId}`)
      toast.success('User deleted')
      await loadUsers()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Delete failed')
    }
  }

  const salesmen = useMemo(() => users.filter((user) => user.role === 'salesman'), [users])

  return (
    <div className="space-y-6">
      <Topbar title="User Management" subtitle="Create and manage salesman accounts" />

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <h3 className="text-lg font-semibold">{editingId ? 'Edit User' : 'Create Salesman'}</h3>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Full Name</label>
            <input value={form.fullName} onChange={(e) => setForm((current) => ({ ...current, fullName: e.target.value }))} className="w-full rounded-2xl border border-slate-200 p-3 dark:border-slate-800 dark:bg-slate-900" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Username</label>
            <input value={form.username} onChange={(e) => setForm((current) => ({ ...current, username: e.target.value }))} className="w-full rounded-2xl border border-slate-200 p-3 dark:border-slate-800 dark:bg-slate-900" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))} className="w-full rounded-2xl border border-slate-200 p-3 dark:border-slate-800 dark:bg-slate-900" placeholder={editingId ? 'Leave blank to keep current password' : ''} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Phone</label>
            <input value={form.phone} onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))} className="w-full rounded-2xl border border-slate-200 p-3 dark:border-slate-800 dark:bg-slate-900" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Role</label>
            <select value={form.role} onChange={(e) => setForm((current) => ({ ...current, role: e.target.value }))} className="w-full rounded-2xl border border-slate-200 p-3 dark:border-slate-800 dark:bg-slate-900">
              <option value="salesman">Salesman</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select value={form.status} onChange={(e) => setForm((current) => ({ ...current, status: e.target.value }))} className="w-full rounded-2xl border border-slate-200 p-3 dark:border-slate-800 dark:bg-slate-900">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="md:col-span-2 flex justify-end gap-3">
            {editingId ? (
              <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm) }} className="rounded-2xl border border-slate-200 px-4 py-2">Cancel</button>
            ) : null}
            <button type="submit" disabled={loading} className="rounded-2xl bg-slate-900 px-4 py-2 text-white dark:bg-slate-800">
              {loading ? 'Saving...' : editingId ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Salesman Accounts</h3>
          <span className="text-sm text-slate-500">{salesmen.length} active records</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Username</th>
                <th className="px-3 py-2">Phone</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {salesmen.map((user) => (
                <tr key={user._id} className="border-b border-slate-200 dark:border-slate-800">
                  <td className="px-3 py-2">{user.fullName}</td>
                  <td className="px-3 py-2">{user.username}</td>
                  <td className="px-3 py-2">{user.phone || '—'}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col gap-1">
                      <span className={`w-fit rounded-full px-2 py-1 text-xs ${user.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {user.status || 'active'}
                      </span>
                      {user.isApproved === false ? (
                        <span className="w-fit rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-700">Pending approval</span>
                      ) : (
                        <span className="w-fit rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">Approved</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => handleEdit(user)} className="rounded-lg border border-slate-200 px-2 py-1">Edit</button>
                      <button onClick={() => handleResetPassword(user._id)} className="rounded-lg border border-slate-200 px-2 py-1">Reset</button>
                      {user.isApproved === false ? (
                        <button onClick={() => handleApprove(user._id)} className="rounded-lg border border-emerald-200 px-2 py-1 text-emerald-700">Approve</button>
                      ) : null}
                      <button onClick={() => toggleStatus(user._id, user.status)} className="rounded-lg border border-slate-200 px-2 py-1">{user.status === 'active' ? 'Deactivate' : 'Activate'}</button>
                      <button onClick={() => handleDelete(user._id)} className="rounded-lg border border-rose-200 px-2 py-1 text-rose-600">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
