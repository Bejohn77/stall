import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { FiEdit2, FiPlus, FiSave, FiTrash2 } from 'react-icons/fi'
import Topbar from '../components/Topbar'
import api from '../services/api'
import { formatCurrency } from '../utils/formatters'

const defaultServiceForm = { id: null, name: '', fee: '', unit: 'Page' }

export default function ServiceBillingPage() {
  const [services, setServices] = useState([])
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [serviceForm, setServiceForm] = useState(defaultServiceForm)

  const loadServices = async () => {
    try {
      const { data } = await api.get('/services')
      setServices(data.filter((service) => service.isActive !== false))
      if (!selectedServiceId && data.length) {
        setSelectedServiceId(data[0]._id)
      }
    } catch (error) {
      toast.error('Could not load services')
    }
  }

  useEffect(() => {
    loadServices()
  }, [])

  const selectedService = useMemo(() => services.find((service) => service._id === selectedServiceId), [services, selectedServiceId])

  const addItem = () => {
    if (!selectedService) return toast.error('Create a service first')
    setItems((current) => [
      ...current,
      {
        serviceId: selectedService._id,
        serviceName: selectedService.name,
        unit: selectedService.unit,
        quantity: Number(quantity || 0),
        rate: Number(selectedService.fee || 0),
        total: Number(quantity || 0) * Number(selectedService.fee || 0),
      },
    ])
    setQuantity(1)
  }

  const removeItem = (index) => {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0)

  const completeBill = async () => {
    if (!items.length) return toast.error('Add at least one service item')
    setLoading(true)
    try {
      await api.post('/service-bills', { items })
      toast.success('Service bill completed')
      setItems([])
      setQuantity(1)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save service bill')
    } finally {
      setLoading(false)
    }
  }

  const saveService = async (event) => {
    event.preventDefault()
    if (!serviceForm.name.trim()) return toast.error('Service name is required')
    if (!serviceForm.unit.trim()) return toast.error('Billing unit is required')

    try {
      if (serviceForm.id) {
        await api.put(`/services/${serviceForm.id}`, {
          name: serviceForm.name,
          fee: Number(serviceForm.fee || 0),
          unit: serviceForm.unit,
          isActive: true,
        })
        toast.success('Service updated')
      } else {
        await api.post('/services', {
          name: serviceForm.name,
          fee: Number(serviceForm.fee || 0),
          unit: serviceForm.unit,
        })
        toast.success('Service created')
      }
      setServiceForm(defaultServiceForm)
      await loadServices()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save service')
    }
  }

  const editService = (service) => {
    setServiceForm({ id: service._id, name: service.name, fee: service.fee, unit: service.unit })
  }

  const deleteService = async (serviceId) => {
    try {
      await api.delete(`/services/${serviceId}`)
      toast.success('Service deactivated')
      await loadServices()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not deactivate service')
    }
  }

  return (
    <div className="space-y-6">
      <Topbar title="Service Billing" subtitle="Create and manage services with your own fees and units" />
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Manage Services</h3>
              <p className="text-sm text-slate-500">Add, edit, or deactivate any service your stall offers.</p>
            </div>
            <form onSubmit={saveService} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium">
                  Service name
                  <input value={serviceForm.name} onChange={(e) => setServiceForm((current) => ({ ...current, name: e.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900" placeholder="e.g. Passport photo" />
                </label>
                <label className="block text-sm font-medium">
                  Fee
                  <input type="number" min="0" value={serviceForm.fee} onChange={(e) => setServiceForm((current) => ({ ...current, fee: e.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900" placeholder="0" />
                </label>
              </div>
              <label className="block text-sm font-medium">
                Billing unit
                <input value={serviceForm.unit} onChange={(e) => setServiceForm((current) => ({ ...current, unit: e.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900" placeholder="Page, Copy, Print, Piece, Job" />
              </label>
              <button type="submit" className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 font-medium text-white dark:bg-slate-800">
                <FiSave />
                {serviceForm.id ? 'Update service' : 'Add service'}
              </button>
            </form>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Your Services</h3>
              <p className="text-sm text-slate-500">Any fee or unit can be changed later.</p>
            </div>
            <div className="space-y-3">
              {services.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">No services yet. Create one to start billing.</div>
              ) : services.map((service) => (
                <div key={service._id} className="flex items-center justify-between rounded-[20px] border border-slate-200 p-3 dark:border-slate-800">
                  <div>
                    <p className="font-semibold">{service.name}</p>
                    <p className="text-sm text-slate-500">{formatCurrency(service.fee)} • {service.unit}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => editService(service)} className="rounded-full bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300"><FiEdit2 /></button>
                    <button onClick={() => deleteService(service._id)} className="rounded-full bg-rose-100 p-2 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300"><FiTrash2 /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-4">
            <h3 className="text-lg font-semibold">Create Service Bill</h3>
            <p className="text-sm text-slate-500">Choose a service, enter quantity, and add it to the bill.</p>
          </div>
          <div className="space-y-4">
            <label className="block text-sm font-medium">
              Service
              <select value={selectedServiceId} onChange={(e) => setSelectedServiceId(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                {services.map((service) => (
                  <option key={service._id} value={service._id}>{service.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Quantity / Pages / Units
              <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900" />
            </label>
            <div className="rounded-2xl bg-slate-50 p-3 text-sm dark:bg-slate-900">
              <p className="text-slate-500">Current fee</p>
              <p className="mt-1 text-lg font-semibold">{selectedService ? `${formatCurrency(selectedService.fee)} / ${selectedService.unit}` : 'No service selected'}</p>
            </div>
            <button onClick={addItem} className="flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 font-medium text-white dark:bg-slate-800">
              <FiPlus />
              Add Service Item
            </button>
          </div>

          <div className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Current Bill</h3>
                <p className="text-sm text-slate-500">Multiple services can be added to one bill.</p>
              </div>
            </div>
            <div className="space-y-3">
              {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">No services added yet.</div>
              ) : items.map((item, index) => (
                <div key={`${item.serviceName}-${index}`} className="rounded-[20px] border border-slate-200 p-3 dark:border-slate-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{item.serviceName}</p>
                      <p className="text-sm text-slate-500">{item.quantity} × {formatCurrency(item.rate)} / {item.unit}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{formatCurrency(item.total)}</span>
                      <button onClick={() => removeItem(index)} className="rounded-full bg-rose-100 p-2 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300"><FiTrash2 /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-[24px] bg-slate-50 p-4 dark:bg-slate-900">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
            </div>
            <button onClick={completeBill} disabled={loading} className="mt-5 w-full rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-70">
              {loading ? 'Saving...' : 'Complete Service Bill'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
