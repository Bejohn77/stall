const User = require('../models/User')

async function bootstrapAuth() {
  try {
    const hasAnyUser = await User.exists({})
    if (!hasAnyUser) {
      return
    }

    const existingAdmin = await User.findOne({ username: 'admin' })
    if (existingAdmin && existingAdmin.role !== 'admin') {
      existingAdmin.role = 'admin'
      existingAdmin.isApproved = true
      await existingAdmin.save()
    }

    await User.updateMany(
      { role: { $exists: false } },
      { $set: { role: 'salesman' } },
    )

    await User.updateMany(
      { isApproved: { $exists: false } },
      { $set: { isApproved: true } },
    )
  } catch (error) {
    console.warn('Auth bootstrap skipped:', error.message)
  }
}

module.exports = { bootstrapAuth }
