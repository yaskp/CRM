import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import { sequelize } from './database/connection'
import routes from './routes'
import { errorHandler } from './middleware/errorHandler'
import { logger } from './utils/logger'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api', routes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'CRM API is running' })
})

// Error handling
app.use(errorHandler)

// Start server
const startServer = async () => {
  try {
    await sequelize.authenticate()
    logger.info('Database connection established successfully')
    
    // Sync database (remove in production, use migrations)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false })
      logger.info('Database synced')
    }

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`)
    })
  } catch (error) {
    logger.error('Unable to start server:', error)
    process.exit(1)
  }
}

startServer()

export default app

