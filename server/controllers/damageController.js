const Damage = require('../models/Damage')
const Product = require('../models/Product')
const { getMode, getStore, createId } = require('../utils/store')

function buildDamageReport(damages = []) {
  const totalDamagedQuantity = damages.reduce((sum, damage) => sum + Number(damage.quantity || 0), 0)
  const totalFinancialLoss = damages.reduce((sum, damage) => sum + Number(damage.totalLoss || 0), 0)

  const productCounts = damages.reduce((acc, damage) => {
    const name = damage.productName || 'Unknown'
    acc[name] = (acc[name] || 0) + Number(damage.quantity || 0)
    return acc
  }, {})

  const trend = damages
    .slice()
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map((damage) => ({
      name: new Date(damage.createdAt).toLocaleDateString('en-GB'),
      quantity: Number(damage.quantity || 0),
      loss: Number(damage.totalLoss || 0),
    }))

  return {
    totalDamagedQuantity,
    totalFinancialLoss,
    mostDamagedProduct: Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—',
    trend,
  }
}

async function listDamages(req, res, next) {
  try {
    if (getMode() === 'memory') {
      const store = getStore()
      const { product, from, to } = req.query
      const filtered = (store.damages || []).filter((damage) => {
        const matchesProduct = !product || `${damage.productName}`.toLowerCase().includes(product.toLowerCase())
        const createdAt = new Date(damage.createdAt)
        const matchesFrom = !from || createdAt >= new Date(from)
        const matchesTo = !to || createdAt <= new Date(to)
        return matchesProduct && matchesFrom && matchesTo
      })
      return res.json(filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
    }

    const { product, from, to } = req.query
    const query = {}
    if (product) query.productName = { $regex: product, $options: 'i' }
    if (from || to) {
      query.createdAt = {}
      if (from) query.createdAt.$gte = new Date(from)
      if (to) query.createdAt.$lte = new Date(to)
    }

    const damages = await Damage.find(query).sort({ createdAt: -1 })
    res.json(damages)
  } catch (error) {
    next(error)
  }
}

async function createDamage(req, res, next) {
  try {
    const { productId, quantity, reason, notes } = req.body
    const damageQuantity = Number(quantity || 0)

    if (!productId) return res.status(400).json({ message: 'Select a product first.' })
    if (!reason) return res.status(400).json({ message: 'Damage reason is required.' })
    if (damageQuantity <= 0) return res.status(400).json({ message: 'Damage quantity must be greater than zero.' })

    if (getMode() === 'memory') {
      const store = getStore()
      const product = store.products.find((item) => item._id === productId)
      if (!product) return res.status(404).json({ message: 'Product not found' })
      if (product.stockQuantity < damageQuantity) return res.status(400).json({ message: 'Insufficient stock for this damage entry.' })

      const totalLoss = damageQuantity * Number(product.buyingPrice || 0)
      const damage = {
        _id: createId('damage'),
        productId,
        productName: product.name,
        quantity: damageQuantity,
        costPrice: Number(product.buyingPrice || 0),
        totalLoss,
        reason,
        notes: notes || '',
        createdAt: new Date().toISOString(),
      }
      store.damages = [...(store.damages || []), damage]
      product.stockQuantity -= damageQuantity
      return res.status(201).json(damage)
    }

    const product = await Product.findById(productId)
    if (!product) return res.status(404).json({ message: 'Product not found' })
    if (product.stockQuantity < damageQuantity) return res.status(400).json({ message: 'Insufficient stock for this damage entry.' })

    const totalLoss = damageQuantity * Number(product.buyingPrice || 0)
    const damage = await Damage.create({
      productId,
      productName: product.name,
      quantity: damageQuantity,
      costPrice: Number(product.buyingPrice || 0),
      totalLoss,
      reason,
      notes: notes || '',
    })

    product.stockQuantity -= damageQuantity
    await product.save()
    res.status(201).json(damage)
  } catch (error) {
    next(error)
  }
}

async function deleteDamage(req, res, next) {
  try {
    if (getMode() === 'memory') {
      const store = getStore()
      const damage = (store.damages || []).find((entry) => entry._id === req.params.id)
      if (!damage) return res.status(404).json({ message: 'Damage record not found' })
      const product = store.products.find((item) => item._id === damage.productId)
      if (product) product.stockQuantity += damage.quantity
      store.damages = (store.damages || []).filter((entry) => entry._id !== req.params.id)
      return res.json({ message: 'Damage record deleted' })
    }

    const damage = await Damage.findById(req.params.id)
    if (!damage) return res.status(404).json({ message: 'Damage record not found' })
    const product = await Product.findById(damage.productId)
    if (product) {
      product.stockQuantity += damage.quantity
      await product.save()
    }
    await Damage.findByIdAndDelete(req.params.id)
    res.json({ message: 'Damage record deleted' })
  } catch (error) {
    next(error)
  }
}

async function getDamageReport(req, res, next) {
  try {
    const { from, to } = req.query
    let damages = []

    if (getMode() === 'memory') {
      const store = getStore()
      damages = (store.damages || []).filter((damage) => {
        const createdAt = new Date(damage.createdAt)
        const matchesFrom = !from || createdAt >= new Date(from)
        const matchesTo = !to || createdAt <= new Date(to)
        return matchesFrom && matchesTo
      })
    } else {
      const query = {}
      if (from || to) {
        query.createdAt = {}
        if (from) query.createdAt.$gte = new Date(from)
        if (to) query.createdAt.$lte = new Date(to)
      }
      damages = await Damage.find(query).sort({ createdAt: 1 })
    }

    res.json(buildDamageReport(damages))
  } catch (error) {
    next(error)
  }
}

module.exports = { listDamages, createDamage, deleteDamage, getDamageReport, buildDamageReport }
