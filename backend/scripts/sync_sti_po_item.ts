import { sequelize } from '../src/database/connection'

async function syncPoItemId() {
    try {
        await sequelize.authenticate()
        console.log('Connected')

        try {
            await sequelize.query(`
            ALTER TABLE store_transaction_items 
            ADD COLUMN po_item_id INT NULL,
            ADD CONSTRAINT fk_sti_po_item FOREIGN KEY (po_item_id) REFERENCES purchase_order_items(id)
        `)
            console.log('Added po_item_id to store_transaction_items')
        } catch (e: any) {
            console.log('Skipping po_item_id (might exist):', e.original?.sqlMessage || e.message)
        }

        process.exit(0)
    } catch (error) {
        console.error('Fatal error:', error)
        process.exit(1)
    }
}

syncPoItemId()
