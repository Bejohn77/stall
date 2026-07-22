const mongoose = require('mongoose')

const serviceDefinitionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  fee: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true, trim: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

serviceDefinitionSchema.pre('save', function (next) {
  this.updatedAt = new Date()
  next()
})

module.exports = mongoose.model('ServiceDefinition', serviceDefinitionSchema)
