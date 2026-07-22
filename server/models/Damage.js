const mongoose = require('mongoose')

const damageSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  productName: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, default: 0 },
  costPrice: { type: Number, required: true, default: 0 },
  totalLoss: { type: Number, required: true, default: 0 },
  reason: { type: String, required: true, trim: true },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
})

module.exports = mongoose.model('Damage', damageSchema)
