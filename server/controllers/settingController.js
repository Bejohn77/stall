const Setting = require('../models/Setting')
const { getMode, getStore } = require('../utils/store')

async function getSettings(req, res, next) {
  try {
    if (getMode() === 'memory') {
      return res.json(getStore().settings)
    }

    let settings = await Setting.findOne()
    if (!settings) settings = await Setting.create({})
    res.json(settings)
  } catch (error) {
    next(error)
  }
}

async function updateSettings(req, res, next) {
  try {
    if (getMode() === 'memory') {
      const store = getStore()
      store.settings = { ...store.settings, ...req.body }
      return res.json(store.settings)
    }

    let settings = await Setting.findOne()
    if (!settings) settings = await Setting.create({})
    Object.assign(settings, req.body)
    await settings.save()
    res.json(settings)
  } catch (error) {
    next(error)
  }
}

async function backupData(req, res, next) {
  try {
    if (getMode() === 'memory') {
      const store = getStore()
      return res.json({ products: store.products, sales: store.sales, settings: store.settings })
    }

    const Product = require('../models/Product')
    const Sale = require('../models/Sale')
    const Setting = require('../models/Setting')
    const [products, sales, settings] = await Promise.all([Product.find(), Sale.find(), Setting.findOne()])
    res.json({ products, sales, settings })
  } catch (error) {
    next(error)
  }
}

async function restoreData(req, res, next) {
  try {
    if (getMode() === 'memory') {
      const store = getStore()
      const { products = [], sales = [], settings = null } = req.body
      store.products = products
      store.sales = sales
      store.settings = settings || store.settings
      return res.json({ message: 'Backup restored' })
    }

    const Product = require('../models/Product')
    const Sale = require('../models/Sale')
    const Setting = require('../models/Setting')
    const { products = [], sales = [], settings = null } = req.body
    await Product.deleteMany({})
    await Sale.deleteMany({})
    await Setting.deleteMany({})
    if (products.length) await Product.insertMany(products)
    if (sales.length) await Sale.insertMany(sales)
    if (settings) await Setting.create(settings)
    res.json({ message: 'Backup restored' })
  } catch (error) {
    next(error)
  }
}

module.exports = { getSettings, updateSettings, backupData, restoreData }
