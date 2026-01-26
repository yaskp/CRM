import { sequelize } from './database/connection'
import { logger } from './utils/logger'

const addUnitToItems = async () => {
    try {
        await sequelize.authenticate()
        logger.info('Connected to database')

        const queryInterface = sequelize.getQueryInterface()

        const tableInfo: any = await queryInterface.describeTable('store_transaction_items')

        if (!tableInfo.unit) {
            logger.info('Adding unit column to store_transaction_items...')
            await queryInterface.addColumn('store_transaction_items', 'unit', {
                type: 'VARCHAR(20)',
                allowNull: true
            })
        }

        logger.info('Database columns updated successfully')
        process.exit(0)
    } catch (error) {
        logger.error('Failed to update database:', error)
        process.exit(1)
    }
}

addUnitToItems()
