const MonthlyCost = require('../models/MonthlyCost')
const { getMode, getStore, createId } = require('../utils/store')

function calculateMonthlyCostSummary(costs = [], selectedMonth = '') {
  const normalizedCosts = (costs || []).filter((cost) => {
    const month = String(cost.month || '').trim()
    return !selectedMonth || month === selectedMonth
  })

  const totalMonthlyCost = normalizedCosts.reduce((sum, cost) => sum + Number(cost.amount || 0), 0)

  return {
    totalMonthlyCost,
    costs: normalizedCosts,
  }
}

async function listMonthlyCosts(req, res, next) {
  try {
    const selectedMonth = String(req.query.month || '').trim()

    if (getMode() === 'memory') {
      const store = getStore()
      const costs = (store.monthlyCosts || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date))
      return res.json(calculateMonthlyCostSummary(costs, selectedMonth))
    }

    const query = selectedMonth ? { month: selectedMonth } : {}
    const costs = await MonthlyCost.find(query).sort({ date: -1, createdAt: -1 })
    res.json(calculateMonthlyCostSummary(costs, selectedMonth))
  } catch (error) {
    next(error)
  }
}

async function createMonthlyCost(req, res, next) {
  try {
    const { costName, amount, month, date, note = '' } = req.body

    if (!costName || !month || !date) {
      return res.status(400).json({ message: 'Cost name, month, and date are required' })
    }

    const costPayload = {
      costName: String(costName).trim(),
      amount: Number(amount || 0),
      month: String(month).trim(),
      date: new Date(date),
      note: String(note || '').trim(),
    }

    if (Number.isNaN(costPayload.amount) || costPayload.amount < 0) {
      return res.status(400).json({ message: 'Amount must be a valid non-negative number' })
    }

    if (Number.isNaN(costPayload.date.getTime())) {
      return res.status(400).json({ message: 'Date must be a valid date' })
    }

    if (getMode() === 'memory') {
      const store = getStore()
      const cost = {
        _id: createId('monthly-cost'),
        ...costPayload,
        createdAt: new Date().toISOString(),
      }
      store.monthlyCosts = store.monthlyCosts || []
      store.monthlyCosts.push(cost)
      return res.status(201).json(cost)
    }

    const cost = await MonthlyCost.create(costPayload)
    return res.status(201).json(cost)
  } catch (error) {
    next(error)
  }
}

async function deleteMonthlyCost(req, res, next) {
  try {
    if (getMode() === 'memory') {
      const store = getStore()
      const existing = (store.monthlyCosts || []).find((entry) => entry._id === req.params.id)
      if (!existing) return res.status(404).json({ message: 'Monthly cost not found' })
      store.monthlyCosts = (store.monthlyCosts || []).filter((entry) => entry._id !== req.params.id)
      return res.json({ message: 'Monthly cost deleted' })
    }

    const cost = await MonthlyCost.findByIdAndDelete(req.params.id)
    if (!cost) return res.status(404).json({ message: 'Monthly cost not found' })
    return res.json({ message: 'Monthly cost deleted' })
  } catch (error) {
    next(error)
  }
}

module.exports = { listMonthlyCosts, createMonthlyCost, deleteMonthlyCost, calculateMonthlyCostSummary }
