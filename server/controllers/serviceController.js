const ServiceBill = require('../models/ServiceBill')
const ServiceDefinition = require('../models/ServiceDefinition')
const { getMode, getStore, createId } = require('../utils/store')

async function generateBillNumber() {
  if (getMode() === 'memory') {
    const store = getStore()
    const lastBill = [...store.serviceBills].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
    const lastNumber = lastBill?.billNumber?.match(/(\d+)$/)
    const next = lastNumber ? Number(lastNumber[1]) + 1 : 1
    return `SB-${String(next).padStart(5, '0')}`
  }

  const lastBill = await ServiceBill.findOne().sort({ createdAt: -1 })
  const lastNumber = lastBill?.billNumber?.match(/(\d+)$/)
  const next = lastNumber ? Number(lastNumber[1]) + 1 : 1
  return `SB-${String(next).padStart(5, '0')}`
}

async function listServices(req, res, next) {
  try {
    if (getMode() === 'memory') {
      const store = getStore()
      return res.json((store.services || []).sort((a, b) => a.name.localeCompare(b.name)))
    }

    const services = await ServiceDefinition.find({}).sort({ name: 1 })
    res.json(services)
  } catch (error) {
    next(error)
  }
}

async function createService(req, res, next) {
  try {
    const { name, fee, unit } = req.body
    if (!name?.trim()) return res.status(400).json({ message: 'Service name is required' })
    if (Number.isNaN(Number(fee)) || Number(fee) < 0) return res.status(400).json({ message: 'Fee must be a valid number' })
    if (!unit?.trim()) return res.status(400).json({ message: 'Billing unit is required' })

    const payload = {
      _id: createId('service'),
      name: name.trim(),
      fee: Number(fee),
      unit: unit.trim(),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    if (getMode() === 'memory') {
      const store = getStore()
      store.services = store.services || []
      store.services.push(payload)
      return res.status(201).json(payload)
    }

    const service = await ServiceDefinition.create({ name: payload.name, fee: payload.fee, unit: payload.unit, isActive: true })
    res.status(201).json(service)
  } catch (error) {
    next(error)
  }
}

async function updateService(req, res, next) {
  try {
    const { id } = req.params
    const { name, fee, unit, isActive } = req.body

    if (getMode() === 'memory') {
      const store = getStore()
      const service = (store.services || []).find((item) => item._id === id)
      if (!service) return res.status(404).json({ message: 'Service not found' })
      service.name = name?.trim() || service.name
      service.fee = Number(fee ?? service.fee)
      service.unit = unit?.trim() || service.unit
      service.isActive = typeof isActive === 'boolean' ? isActive : service.isActive
      service.updatedAt = new Date().toISOString()
      return res.json(service)
    }

    const updated = await ServiceDefinition.findByIdAndUpdate(id, { name, fee, unit, isActive, updatedAt: new Date() }, { new: true })
    if (!updated) return res.status(404).json({ message: 'Service not found' })
    res.json(updated)
  } catch (error) {
    next(error)
  }
}

async function deleteService(req, res, next) {
  try {
    const { id } = req.params
    if (getMode() === 'memory') {
      const store = getStore()
      const service = (store.services || []).find((item) => item._id === id)
      if (!service) return res.status(404).json({ message: 'Service not found' })
      service.isActive = false
      service.updatedAt = new Date().toISOString()
      return res.json(service)
    }

    const service = await ServiceDefinition.findByIdAndUpdate(id, { isActive: false, updatedAt: new Date() }, { new: true })
    if (!service) return res.status(404).json({ message: 'Service not found' })
    res.json(service)
  } catch (error) {
    next(error)
  }
}

async function createServiceBill(req, res, next) {
  try {
    const { items = [] } = req.body
    if (!items.length) return res.status(400).json({ message: 'Add at least one service item' })

    const normalizedItems = await Promise.all(items.map(async (item) => {
      const quantity = Number(item.quantity || 0)
      let service = null
      if (item.serviceId) {
        if (getMode() === 'memory') {
          service = getStore().services?.find((entry) => entry._id === item.serviceId)
        } else {
          service = await ServiceDefinition.findById(item.serviceId)
        }
      }

      const rate = Number(item.rate ?? item.fee ?? service?.fee ?? 0)
      const serviceName = item.serviceName || service?.name || 'Custom service'
      const unit = item.unit || service?.unit || 'unit'
      const total = quantity * rate
      return {
        serviceId: item.serviceId || service?._id || null,
        serviceName,
        unit,
        quantity,
        rate,
        total,
      }
    }))

    const subtotal = normalizedItems.reduce((sum, item) => sum + item.total, 0)
    const billNumber = await generateBillNumber()
    const bill = {
      _id: createId('service-bill'),
      billNumber,
      items: normalizedItems,
      subtotal,
      createdAt: new Date().toISOString(),
    }

    if (getMode() === 'memory') {
      const store = getStore()
      store.serviceBills.push(bill)
      return res.status(201).json(bill)
    }

    const savedBill = await ServiceBill.create({ billNumber, items: normalizedItems, subtotal })
    res.status(201).json(savedBill)
  } catch (error) {
    next(error)
  }
}

async function listServiceBills(req, res, next) {
  try {
    if (getMode() === 'memory') {
      const store = getStore()
      return res.json([...store.serviceBills].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
    }

    const bills = await ServiceBill.find().sort({ createdAt: -1 })
    res.json(bills)
  } catch (error) {
    next(error)
  }
}

module.exports = { listServices, createService, updateService, deleteService, createServiceBill, listServiceBills }
