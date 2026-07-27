const mongoose = require('mongoose')

const monthlyCostSchema = new mongoose.Schema({
  costName: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, default: 0 },
  month: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  note: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
})

monthlyCostSchema.index({ month: 1, createdAt: -1 })

module.exports = mongoose.model('MonthlyCost', monthlyCostSchema)
