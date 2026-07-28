const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const dotenv = require('dotenv')
const path = require('path')
const { connectDatabase } = require('./config/db')
const { bootstrapAuth } = require('./services/authBootstrap')

dotenv.config({ path: path.join(__dirname, '.env') })

const app = express()
const port = process.env.PORT || 5000

app.use(helmet())
app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)
app.use('/api', require('./routes'))

app.get('/', (req, res) => {
  res.json({ message: 'Stall API is running' })
})

app.use(require('./middleware/notFound'))
app.use(require('./middleware/errorHandler'))

connectDatabase()
  .then(async () => {
    await bootstrapAuth()
    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`)
    })
  })
  .catch((error) => {
    console.error('Server startup failed:', error.message)
    process.exit(1)
  })
