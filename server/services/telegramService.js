const axios = require('axios')

function getTelegramConfig(settings = {}) {
  const botToken = settings?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN?.trim()
  const chatId = settings?.telegramChatId || process.env.TELEGRAM_CHAT_ID?.trim()
  return { botToken, chatId }
}

function formatDateTime(value = new Date()) {
  return new Date(value).toLocaleString('en-BD', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })
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
        `Added: +${payload.addedQuantity}`,
        `Current Stock: ${payload.currentStock}`,
        '',
        `Updated by: ${payload.updatedBy || 'Owner'}`,
        `Date & Time: ${formatDateTime(payload.timestamp)}`,
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

async function sendLowStockNotification(product, settings = {}) {
  const text = getTelegramMessageText('low-stock', {
    productName: product.name,
    currentStock: product.stockQuantity,
    minimumLevel: 10,
    timestamp: new Date(),
  }, settings)
  return sendTelegramMessage(text, settings)
}

async function sendStockUpdatedNotification(product, previousStock, addedQuantity, settings = {}, updatedBy = 'Owner') {
  const text = getTelegramMessageText('stock-updated', {
    productName: product.name,
    previousStock,
    addedQuantity,
    currentStock: product.stockQuantity,
    updatedBy,
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
  sendSaleNotification,
  sendLowStockNotification,
  sendStockUpdatedNotification,
  sendDamageNotification,
  shouldSendLowStockNotification,
}
