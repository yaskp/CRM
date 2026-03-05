import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
dotenv.config()
// Import models FIRST to ensure all associations are loaded (Force Rewrite)
import './models/index'
import { sequelize } from './database/connection'
import routes from './routes'
import { errorHandler } from './middleware/errorHandler'
import { logger } from './utils/logger'

const app = express()
const PORT = process.env.PORT || 5000

// Force restart for schema update

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'))

// Routes
app.use('/api', routes)

// Health check
app.get('/api/health', (_req, res) => {
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

    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`)
    })

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use. Please stop the existing server or use a different port.`)
        logger.info(`To find and kill the process using port ${PORT}, run: netstat -ano | findstr :${PORT}`)
        logger.info(`Then kill it with: taskkill /PID <PID> /F`)
        process.exit(1)
      } else {
        logger.error('Server error:', error)
        process.exit(1)
      }
    })
  } catch (error) {
    logger.error('Unable to start server:', error)
    process.exit(1)
  }
}

startServer()

export default app

