const mongoose = require('mongoose')

async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI?.trim()
  const dbName = process.env.DB_NAME?.trim()

  if (!mongoUri) {
    const message = 'MongoDB connection is not configured. Set MONGODB_URI in server/.env and, if needed, DB_NAME.'
    console.error(message)
    throw new Error(message)
  }

  try {
    const connection = await mongoose.connect(mongoUri, {
      dbName: dbName || undefined,
    })

    global.__dbMode = 'mongo'
    console.log(`Connected to MongoDB${dbName ? ` (database: ${dbName})` : ''}`)
    return connection
  } catch (error) {
    const message = `MongoDB connection failed. Check MONGODB_URI and DB_NAME in server/.env. ${error.message}`
    console.error(message)
    throw new Error(message)
  }
}

module.exports = { connectDatabase }
