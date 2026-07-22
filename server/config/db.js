const mongoose = require('mongoose')

async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI?.trim()
  const dbName = process.env.DB_NAME?.trim()

  if (!mongoUri) {
    global.__dbMode = 'memory'
    console.warn('MongoDB connection is not configured. Falling back to the in-memory store.')
    return null
  }

  try {
    const connection = await mongoose.connect(mongoUri, {
      dbName: dbName || undefined,
    })

    global.__dbMode = 'mongo'
    console.log(`Connected to MongoDB${dbName ? ` (database: ${dbName})` : ''}`)
    return connection
  } catch (error) {
    global.__dbMode = 'memory'
    const message = `MongoDB connection failed. Falling back to the in-memory store. ${error.message}`
    console.warn(message)
    return null
  }
}

module.exports = { connectDatabase }
