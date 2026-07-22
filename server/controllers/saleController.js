const Product = require('../models/Product')
const Sale = require('../models/Sale')
const Setting = require('../models/Setting')
const { sendSaleNotification, sendLowStockNotification, shouldSendLowStockNotification } = require('../services/telegramService')
const { calculateInvoiceProfit, calculateInvoiceSummary, validateInvoicePayload } = require('../utils/invoice')
const { getMode, getStore, createId } = require('../utils/store')

async function generateInvoiceNumber() {
  if (getMode() === 'memory') {
    const store = getStore()
    const lastSale = [...store.sales].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
    const lastNumber = lastSale?.invoiceNumber?.match(/(\d+)$/)
    const next = lastNumber ? Number(lastNumber[1]) + 1 : 1
    return `INV-${String(next).padStart(5, '0')}`
  }

  const lastSale = await Sale.findOne().sort({ createdAt: -1 })
  const lastNumber = lastSale?.invoiceNumber?.match(/(\d+)$/)
  const next = lastNumber ? Number(lastNumber[1]) + 1 : 1
  return `INV-${String(next).padStart(5, '0')}`
}

async function createSale(req, res, next) {
  try {
    const { items = [], customerName = '', customerPhone = '', paymentMethod = 'Cash', paidAmount = 0 } = req.body

    const validation = validateInvoicePayload({ items, customerName, customerPhone, paymentMethod, paidAmount })
    if (!validation.ok) return res.status(400).json({ message: validation.message })

    const normalizedItems = []
    const inventoryUpdates = []

    for (const item of items) {
      const type = item.type === 'service' ? 'service' : 'product'
      if (type === 'product') {
        const product = getMode() === 'memory'
          ? getStore().products.find((entry) => entry._id === item.productId)
          : await Product.findById(item.productId)

        if (!product) return res.status(404).json({ message: `Product ${item.productId} not found` })
        const quantity = Number(item.quantity || 0)
        if (product.stockQuantity < quantity) return res.status(400).json({ message: `${product.name} is out of stock` })

        const lineTotal = Number(product.sellingPrice || 0) * quantity
        const discount = Number(item.discount || 0)
        const tax = Number(item.tax || 0)
        const total = Math.max(0, lineTotal - Math.min(discount, lineTotal) + tax)

        normalizedItems.push({
          type,
          productId: product._id,
          name: product.name,
          quantity,
          unitPrice: Number(product.sellingPrice || 0),
          discount,
          tax,
          total,
          buyingPrice: product.buyingPrice,
        })
        inventoryUpdates.push({ product, quantity })
        continue
      }

      const quantity = Number(item.quantity || item.serviceQuantity || 0)
      const unitPrice = Number(item.unitPrice ?? item.rate ?? 0)
      const discount = Number(item.discount || 0)
      const tax = Number(item.tax || 0)
      const total = Math.max(0, quantity * unitPrice - Math.min(discount, quantity * unitPrice) + tax)

      normalizedItems.push({
        type,
        serviceId: item.serviceId || null,
        name: item.name || 'Service charge',
        description: item.description || '',
        quantity,
        unitPrice,
        discount,
        tax,
        total,
      })
    }

    const summary = calculateInvoiceSummary(normalizedItems, Number(paidAmount || 0))
    const profit = calculateInvoiceProfit(normalizedItems)

    if (getMode() === 'memory') {
      const store = getStore()
      const invoiceNumber = await generateInvoiceNumber()
      const sale = {
        _id: createId('sale'),
        invoiceNumber,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        items: summary.items,
        subtotal: summary.subtotal,
        discount: summary.discount,
        tax: summary.tax,
        grandTotal: summary.grandTotal,
        profit,
        paymentMethod,
        paidAmount: summary.paidAmount,
        dueAmount: summary.dueAmount,
        change: summary.change,
        createdAt: new Date().toISOString(),
      }

      for (const update of inventoryUpdates) {
        update.product.stockQuantity -= update.quantity
      }

      store.sales.push(sale)
      const settings = store.settings
      const lowStockState = store.__telegramLowStockState || (store.__telegramLowStockState = {})
      for (const update of inventoryUpdates) {
        const previousStock = Number(update.product.stockQuantity + update.quantity)
        const currentStock = Number(update.product.stockQuantity)
        if (shouldSendLowStockNotification({ ...update.product, stockQuantity: currentStock }, previousStock, lowStockState)) {
          void sendLowStockNotification(update.product, settings).catch((error) => {
            console.warn('Low stock Telegram notification skipped after error:', error.message)
          })
        }
      }
      if (settings) {
        void sendSaleNotification(sale, settings).catch((error) => {
          console.warn('Telegram notification skipped after error:', error.message)
        })
      }
      return res.status(201).json(sale)
    }

    const settings = await Setting.findOne()

    for (const update of inventoryUpdates) {
      const previousStock = Number(update.product.stockQuantity)
      update.product.stockQuantity -= update.quantity
      await update.product.save()

      const lowStockState = global.__telegramLowStockState || (global.__telegramLowStockState = {})
      if (shouldSendLowStockNotification(update.product, previousStock, lowStockState)) {
        void sendLowStockNotification(update.product, settings).catch((error) => {
          console.warn('Low stock Telegram notification skipped after error:', error.message)
        })
      }
    }

    const invoiceNumber = await generateInvoiceNumber()
    const sale = await Sale.create({
      invoiceNumber,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      items: summary.items,
      subtotal: summary.subtotal,
      discount: summary.discount,
      tax: summary.tax,
      grandTotal: summary.grandTotal,
      profit,
      paymentMethod,
      paidAmount: summary.paidAmount,
      dueAmount: summary.dueAmount,
      change: summary.change,
    })

    if (settings) {
      void sendSaleNotification(sale, settings).catch((error) => {
        console.warn('Telegram notification skipped after error:', error.message)
      })
    }

    res.status(201).json(sale)
  } catch (error) {
    next(error)
  }
}

async function listSales(req, res, next) {
  try {
    if (getMode() === 'memory') {
      const store = getStore()
      return res.json([...store.sales].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
    }
    const sales = await Sale.find().sort({ createdAt: -1 })
    res.json(sales)
  } catch (error) {
    next(error)
  }
}

async function deleteSale(req, res, next) {
  try {
    if (getMode() === 'memory') {
      const store = getStore()
      const sale = store.sales.find((entry) => entry._id === req.params.id)
      if (!sale) return res.status(404).json({ message: 'Sale not found' })
      for (const item of sale.items) {
        if (item.type === 'product') {
          const product = store.products.find((entry) => entry._id === item.productId)
          if (product) product.stockQuantity += item.quantity
        }
      }
      store.sales = store.sales.filter((entry) => entry._id !== req.params.id)
      return res.json({ message: 'Sale deleted' })
    }

    const sale = await Sale.findById(req.params.id)
    if (!sale) return res.status(404).json({ message: 'Sale not found' })

    for (const item of sale.items) {
      if (item.type === 'product') {
        const product = await Product.findById(item.productId)
        if (product) {
          product.stockQuantity += item.quantity
          await product.save()
        }
      }
    }

    await Sale.findByIdAndDelete(req.params.id)
    res.json({ message: 'Sale deleted' })
  } catch (error) {
    next(error)
  }
}

module.exports = { createSale, listSales, deleteSale }
