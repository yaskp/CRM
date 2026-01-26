import { sequelize } from './database/connection'
import { logger } from './utils/logger'

const addGrnImageFields = async () => {
    try {
        await sequelize.authenticate()
        logger.info('Connected to database')

        const queryInterface = sequelize.getQueryInterface()

        const tableInfo: any = await queryInterface.describeTable('store_transactions')

        if (!tableInfo.challan_image) {
            logger.info('Adding challan_image column...')
            await queryInterface.addColumn('store_transactions', 'challan_image', {
                type: 'VARCHAR(255)',
                allowNull: true
            })
        }

        if (!tableInfo.invoice_image) {
            logger.info('Adding invoice_image column...')
            await queryInterface.addColumn('store_transactions', 'invoice_image', {
                type: 'VARCHAR(255)',
                allowNull: true
            })
        }

        if (!tableInfo.goods_image) {
            logger.info('Adding goods_image column...')
            await queryInterface.addColumn('store_transactions', 'goods_image', {
                type: 'VARCHAR(255)',
                allowNull: true
            })
        }

        if (!tableInfo.receiver_image) {
            logger.info('Adding receiver_image column...')
            await queryInterface.addColumn('store_transactions', 'receiver_image', {
                type: 'VARCHAR(255)',
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

addGrnImageFields()
