const axios = require('axios')

function getTelegramConfig(settings = {}) {
  const botToken = settings?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN?.trim()
  const chatId = settings?.telegramChatId || process.env.TELEGRAM_CHAT_ID?.trim()
  return { botToken, chatId }
}

function formatDateTime(value = new Date()) {
  return new Date(value).toLocaleString('en-BD', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })
}

function formatDate(value = new Date()) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })
}

function formatTime(value = new Date()) {
  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  })
}

function getTelegramMessageText(eventType, payload = {}, settings = {}) {
  const currency = settings.currency || '৳'
  switch (eventType) {
    case 'low-stock':
      return [
        '⚠️ LOW STOCK ALERT',
        '',
        `Product: ${payload.productName}`,
        `Current Stock: ${payload.currentStock}`,
        `Minimum Level: ${payload.minimumLevel || 10}`,
        '',
        'Please restock this item.',
        '',
        `Date & Time: ${formatDateTime(payload.timestamp)}`,
      ].join('\n')
    case 'stock-updated':
      return [
        '📦 STOCK UPDATED',
        '',
        `Product: ${payload.productName}`,
        '',
        `Previous Stock: ${payload.previousStock}`,
        `Updated Quantity: ${payload.updatedQuantity > 0 ? `+${payload.updatedQuantity}` : payload.updatedQuantity}`,
        `Current Stock: ${payload.currentStock}`,
        '',
        `Update Type: ${payload.updateType || (payload.updatedQuantity > 0 ? 'Stock Added' : 'Stock Reduced')}`,
        `Updated By: ${payload.updatedBy || 'Owner'}`,
        '',
        `Date: ${payload.date || formatDate(payload.timestamp)}`,
        `Time: ${payload.time || formatTime(payload.timestamp)}`,
      ].join('\n')
    case 'product-damaged':
      return [
        '🚨 PRODUCT DAMAGED',
        '',
        `Product: ${payload.productName}`,
        `Damaged Quantity: ${payload.damagedQuantity}`,
        `Remaining Stock: ${payload.remainingStock}`,
        `Reason: ${payload.reason}`,
        `Loss Amount: ${currency}${payload.lossAmount || 0}`,
        '',
        `Date & Time: ${formatDateTime(payload.timestamp)}`,
      ].join('\n')
    case 'sale':
      return [
        '🛒 New Sale',
        '',
        `Invoice: ${payload.invoiceNumber}`,
        'Items:',
        ...(payload.items || []).map((item) => `• ${item.name} ×${item.quantity}`),
        '',
        `Total: ${currency}${payload.grandTotal}`,
        `Profit: ${currency}${payload.profit}`,
        `Payment: ${payload.paymentMethod}`,
        '',
        'Time:',
        formatDateTime(payload.timestamp || payload.createdAt),
      ].join('\n')
    case 'sale-deleted':
      return [
        '🗑️ SALE DELETED',
        '',
        `Invoice: ${payload.invoiceNumber}`,
        `Customer: ${payload.customerName || 'N/A'}`,
        `Total: ${currency}${payload.grandTotal || 0}`,
        '',
        'Deleted At:',
        formatDateTime(payload.deletedAt || payload.timestamp || new Date()),
      ].join('\n')
    case 'product-added':
      return [
        '🆕 NEW PRODUCT ADDED',
        '',
        `Product: ${payload.productName}`,
        `Category: ${payload.category}`,
        `Buying Price: ${currency}${payload.buyingPrice}`,
        `Selling Price: ${currency}${payload.sellingPrice}`,
        `Initial Stock: ${payload.stock}`,
        '',
        `Date & Time: ${formatDateTime(payload.timestamp)}`,
      ].join('\n')

    case 'product-deleted':
      return [
        '🗑️ PRODUCT DELETED',
        '',
        `Product: ${payload.productName}`,
        `Category: ${payload.category}`,
        `Last Stock: ${payload.stock}`,
        '',
        `Date & Time: ${formatDateTime(payload.timestamp)}`,
      ].join('\n')
    default:
      return ''
  }
}

async function sendTelegramMessage(text, settings = {}) {
  const { botToken, chatId } = getTelegramConfig(settings)
  if (!botToken || !chatId) {
    return { ok: false, skipped: true, reason: 'Telegram credentials are not configured' }
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`

  try {
    const response = await axios.post(url, {
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }, { timeout: 10000 })

    return { ok: response?.data?.ok === true, response: response?.data }
  } catch (error) {
    const detail = error.response?.data?.description || error.message
    console.error(`Telegram notification failed: ${detail}`)
    return { ok: false, error: detail }
  }
}

async function sendSaleNotification(sale, settings = {}) {
  const text = getTelegramMessageText('sale', {
    invoiceNumber: sale.invoiceNumber,
    items: sale.items,
    grandTotal: sale.grandTotal,
    profit: sale.profit,
    paymentMethod: sale.paymentMethod,
    createdAt: sale.createdAt,
  }, settings)
  return sendTelegramMessage(text, settings)
}

async function sendSaleDeletedNotification(sale, settings = {}) {
  const text = getTelegramMessageText('sale-deleted', {
    invoiceNumber: sale.invoiceNumber,
    customerName: sale.customerName,
    grandTotal: sale.grandTotal,
    deletedAt: new Date(),
  }, settings)
  return sendTelegramMessage(text, settings)
}

async function sendLowStockNotification(product, settings = {}) {
  const text = getTelegramMessageText('low-stock', {
    productName: product.name,
    currentStock: product.stockQuantity,
    minimumLevel: 10,
    timestamp: new Date(),
  }, settings)
  return sendTelegramMessage(text, settings)
}

async function sendStockUpdatedNotification(product, previousStock, updatedQuantity, settings = {}, updatedBy = 'Owner', updateType = null) {
  const text = getTelegramMessageText('stock-updated', {
    productName: product.name,
    previousStock,
    updatedQuantity,
    currentStock: product.stockQuantity,
    updatedBy,
    updateType: updateType || (updatedQuantity > 0 ? 'Stock Added' : 'Stock Reduced'),
    timestamp: new Date(),
  }, settings)
  return sendTelegramMessage(text, settings)
}

async function sendDamageNotification(damage, product, settings = {}) {
  const text = getTelegramMessageText('product-damaged', {
    productName: damage.productName || product?.name,
    damagedQuantity: damage.quantity,
    remainingStock: product?.stockQuantity,
    reason: damage.reason,
    lossAmount: damage.totalLoss,
    timestamp: damage.createdAt || new Date(),
  }, settings)
  return sendTelegramMessage(text, settings)
}

async function sendProductAddedNotification(product, settings = {}) {
  const text = getTelegramMessageText(
    'product-added',
    {
      productName: product.name,
      category: product.category,
      buyingPrice: product.buyingPrice,
      sellingPrice: product.sellingPrice,
      stock: product.stockQuantity,
      timestamp: new Date(),
    },
    settings
  )

  return sendTelegramMessage(text, settings)
}

async function sendProductDeletedNotification(product, settings = {}) {
  const text = getTelegramMessageText(
    'product-deleted',
    {
      productName: product.name,
      category: product.category,
      stock: product.stockQuantity,
      timestamp: new Date(),
    },
    settings
  )

  return sendTelegramMessage(text, settings)
}

function shouldSendLowStockNotification(product, previousStock, state = {}) {
  const threshold = 10
  const currentStock = Number(product?.stockQuantity ?? 0)
  const lastStock = Number(previousStock ?? 0)
  const key = product?._id || product?.name || 'unknown'
  const previousState = state?.[key]

  if (currentStock > threshold) {
    state[key] = { alerted: false, lastStock: currentStock }
    return false
  }

  if (currentStock <= threshold && lastStock > threshold) {
    state[key] = { alerted: true, lastStock: currentStock }
    return true
  }

  if (previousState?.alerted) {
    return false
  }

  if (currentStock <= threshold) {
    state[key] = { alerted: true, lastStock: currentStock }
    return true
  }

  return false
}

module.exports = {
  getTelegramMessageText,
  sendSaleNotification,
  sendSaleDeletedNotification,
  sendLowStockNotification,
  sendStockUpdatedNotification,
  sendDamageNotification,
  sendProductAddedNotification,
  sendProductDeletedNotification,
  shouldSendLowStockNotification,
}
