const { randomUUID } = require('crypto')

function getStore() {
  if (!global.__stallStore) {
    global.__stallStore = {
      products: [],
      sales: [],
      serviceBills: [],
      damages: [],
      settings: {
        storeName: 'Stall Manager',
        phone: '',
        address: '',
        currency: '৳',
        theme: 'light',
        telegramBotToken: '',
        telegramChatId: '',
      },
    }
  }
  return global.__stallStore
}

function getMode() {
  return global.__dbMode || 'memory'
}

function createId(prefix = 'id') {
  return `${prefix}-${randomUUID()}`
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

module.exports = { getStore, getMode, createId, clone }
