const axios = require('axios')

function getTelegramConfig(settings = {}) {
  const botToken = settings?.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN?.trim()
  const chatId = settings?.telegramChatId || process.env.TELEGRAM_CHAT_ID?.trim()
  return { botToken, chatId }
}

async function sendSaleNotification(sale, settings = {}) {
  const { botToken, chatId } = getTelegramConfig(settings)
  if (!botToken || !chatId) {
    return { ok: false, skipped: true, reason: 'Telegram credentials are not configured' }
  }

  const message = [
    '🛒 New Sale',
    '',
    `Invoice: ${sale.invoiceNumber}`,
    'Items:',
    ...sale.items.map((item) => `• ${item.name} ×${item.quantity}`),
    '',
    `Total: ${settings.currency || ''}${sale.grandTotal}`,
    `Profit: ${settings.currency || ''}${sale.profit}`,
    `Payment: ${sale.paymentMethod}`,
    '',
    'Time:',
    new Date(sale.createdAt).toLocaleString('en-BD'),
  ].join('\n')

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`

  try {
    const response = await axios.post(url, {
      chat_id: chatId,
      text: message,
      disable_web_page_preview: true,
    }, { timeout: 10000 })

    return { ok: response?.data?.ok === true, response: response?.data }
  } catch (error) {
    const detail = error.response?.data?.description || error.message
    console.error(`Telegram notification failed: ${detail}`)
    return { ok: false, error: detail }
  }
}

async function sendLowStockNotification(product, settings = {}) {
  const { botToken, chatId } = getTelegramConfig(settings)
  if (!botToken || !chatId) {
    return { ok: false, skipped: true, reason: 'Telegram credentials are not configured' }
  }

  const message = [
    '⚠️ Low Stock Alert',
    '',
    `Product: ${product.name}`,
    `Current Stock: ${product.stockQuantity}`,
    '',
    'Please restock soon.',
  ].join('\n')

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`

  try {
    const response = await axios.post(url, {
      chat_id: chatId,
      text: message,
      disable_web_page_preview: true,
    }, { timeout: 10000 })

    return { ok: response?.data?.ok === true, response: response?.data }
  } catch (error) {
    const detail = error.response?.data?.description || error.message
    console.error(`Telegram low-stock notification failed: ${detail}`)
    return { ok: false, error: detail }
  }
}

module.exports = { sendSaleNotification, sendLowStockNotification }
