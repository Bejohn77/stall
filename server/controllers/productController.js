const Product = require('../models/Product')
const { sendLowStockNotification } = require('../services/telegramService')
const { getMode, getStore, createId, clone } = require('../utils/store')

async function listProducts(req, res, next) {
  try {
    if (getMode() === 'memory') {
      const store = getStore()
      const { search, category, lowStock } = req.query
      const filtered = store.products.filter((product) => {
        const matchesSearch = !search || `${product.name} ${product.category}`.toLowerCase().includes(search.toLowerCase())
        const matchesCategory = !category || category === 'all' || product.category === category
        const matchesLowStock = lowStock !== 'true' || product.stockQuantity <= 10
        return matchesSearch && matchesCategory && matchesLowStock
      })
      return res.json(filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
    }

    const { search, category, lowStock } = req.query
    const filter = {}

    if (search) filter.name = { $regex: search, $options: 'i' }
    if (category && category !== 'all') filter.category = category
    if (lowStock === 'true') filter.stockQuantity = { $lte: 10 }

    const products = await Product.find(filter).sort({ createdAt: -1 })
    res.json(products)
  } catch (error) {
    next(error)
  }
}

async function createProduct(req, res, next) {
  try {
    if (getMode() === 'memory') {
      const store = getStore()
      const product = {
        _id: createId('product'),
        ...req.body,
        buyingPrice: Number(req.body.buyingPrice || 0),
        sellingPrice: Number(req.body.sellingPrice || 0),
        stockQuantity: Number(req.body.stockQuantity || 0),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      store.products.push(product)
      if (product.stockQuantity <= 10) {
        const notification = await sendLowStockNotification(product, store.settings)
        if (!notification.ok && !notification.skipped) {
          console.warn('Low stock Telegram notification skipped after error:', notification.error)
        }
      }
      return res.status(201).json(product)
    }

    const product = await Product.create(req.body)
    if (product.stockQuantity <= 10) {
      const settings = await require('../models/Setting').findOne()
      const notification = await sendLowStockNotification(product, settings)
      if (!notification.ok && !notification.skipped) {
        console.warn('Low stock Telegram notification skipped after error:', notification.error)
      }
    }
    res.status(201).json(product)
  } catch (error) {
    next(error)
  }
}

async function updateProduct(req, res, next) {
  try {
    if (getMode() === 'memory') {
      const store = getStore()
      const product = store.products.find((item) => item._id === req.params.id)
      if (!product) return res.status(404).json({ message: 'Product not found' })
      Object.assign(product, { ...req.body, buyingPrice: Number(req.body.buyingPrice || product.buyingPrice), sellingPrice: Number(req.body.sellingPrice || product.sellingPrice), stockQuantity: Number(req.body.stockQuantity || product.stockQuantity), updatedAt: new Date().toISOString() })
      return res.json(product)
    }

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!product) return res.status(404).json({ message: 'Product not found' })
    if (product.stockQuantity <= 10) {
      const settings = await require('../models/Setting').findOne()
      const notification = await sendLowStockNotification(product, settings)
      if (!notification.ok && !notification.skipped) {
        console.warn('Low stock Telegram notification skipped after error:', notification.error)
      }
    }
    res.json(product)
  } catch (error) {
    next(error)
  }
}

async function deleteProduct(req, res, next) {
  try {
    if (getMode() === 'memory') {
      const store = getStore()
      const index = store.products.findIndex((item) => item._id === req.params.id)
      if (index === -1) return res.status(404).json({ message: 'Product not found' })
      store.products.splice(index, 1)
      return res.json({ message: 'Product deleted' })
    }

    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found' })
    res.json({ message: 'Product deleted' })
  } catch (error) {
    next(error)
  }
}

module.exports = { listProducts, createProduct, updateProduct, deleteProduct }
