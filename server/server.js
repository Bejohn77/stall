const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const path = require('path')
const { connectDatabase } = require('./config/db')

dotenv.config({ path: path.join(__dirname, '.env') })

const app = express()
const port = process.env.PORT || 5000

app.use(cors())
app.use(express.json())
app.use('/api', require('./routes'))

app.get('/', (req, res) => {
  res.json({ message: 'Stall API is running' })
})

app.use(require('./middleware/notFound'))
app.use(require('./middleware/errorHandler'))

connectDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`)
    })
  })
  .catch((error) => {
    console.error('Server startup failed:', error.message)
    process.exit(1)
  })
