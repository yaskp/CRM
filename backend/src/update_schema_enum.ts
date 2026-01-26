import { sequelize } from './database/connection'
import { logger } from './utils/logger'

const updateSchema = async () => {
    try {
        await sequelize.authenticate()
        logger.info('Connected to database')

        const queryInterface = sequelize.getQueryInterface()

        logger.info('Updating store_transactions status enum...')
        // MySQL doesn't support easy ENUM alteration, we might need to use raw query
        // or just change it to VARCHAR then back, but usually raw query is faster
        await sequelize.query("ALTER TABLE store_transactions MODIFY COLUMN status ENUM('draft', 'pending', 'approved', 'rejected') DEFAULT 'draft'");

        logger.info('Database schema updated successfully')
        process.exit(0)
    } catch (error) {
        logger.error('Failed to update database schema:', error)
        process.exit(1)
    }
}

updateSchema()
