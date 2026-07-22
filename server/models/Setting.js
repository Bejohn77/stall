const mongoose = require('mongoose')

const settingSchema = new mongoose.Schema({
  storeName: { type: String, default: 'Stall Manager' },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  currency: { type: String, default: '৳' },
  theme: { type: String, default: 'light' },
  telegramBotToken: { type: String, default: '' },
  telegramChatId: { type: String, default: '' },
})

module.exports = mongoose.model('Setting', settingSchema)
