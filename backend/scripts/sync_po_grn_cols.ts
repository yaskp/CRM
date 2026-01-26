import { sequelize } from '../src/database/connection'

async function syncNewGrnColumns() {
    try {
        await sequelize.authenticate()
        console.log('Connected')

        // 1. Update purchase_order_items
        try {
            await sequelize.query(`
            ALTER TABLE purchase_order_items 
            ADD COLUMN received_quantity DECIMAL(10, 2) DEFAULT 0
        `)
            console.log('Added received_quantity to purchase_order_items')
        } catch (e: any) {
            console.log('Skipping received_quantity (might exist):', e.original?.sqlMessage || e.message)
        }

        // 2. Update store_transaction_items
        try {
            await sequelize.query(`
            ALTER TABLE store_transaction_items 
            ADD COLUMN item_status VARCHAR(50) DEFAULT 'Good'
        `)
            console.log('Added item_status to store_transaction_items')
        } catch (e: any) {
            console.log('Skipping item_status (might exist):', e.original?.sqlMessage || e.message)
        }

        process.exit(0)
    } catch (error) {
        console.error('Fatal error:', error)
        process.exit(1)
    }
}

syncNewGrnColumns()
