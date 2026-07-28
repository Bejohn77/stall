const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  phone: { type: String, trim: true },
  role: { type: String, enum: ['admin', 'salesman', 'staff'], default: 'salesman' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  isActive: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)
