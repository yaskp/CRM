import { sequelize } from '../src/database/connection'

async function addStoreTransactionItemColumns() {
    try {
        await sequelize.authenticate()
        console.log('Connected')

        const cols = [
            { name: 'wastage_quantity', type: 'DECIMAL(10, 2) DEFAULT 0' },
            { name: 'work_item_type_id', type: 'INT NULL', fk: 'work_item_types(id)' },
        ]

        for (const col of cols) {
            try {
                await sequelize.query(`
                ALTER TABLE store_transaction_items 
                ADD COLUMN ${col.name} ${col.type}
            `)
                console.log(`Added column ${col.name}`)

                if (col.fk) {
                    await sequelize.query(`
                    ALTER TABLE store_transaction_items 
                    ADD CONSTRAINT fk_sti_${col.name}
                    FOREIGN KEY (${col.name}) REFERENCES ${col.fk}
                `)
                    console.log(`Added FK for ${col.name}`)
                }
            } catch (e: any) {
                console.log(`Skipping ${col.name} (might exist):`, e.original?.sqlMessage || e.message)
            }
        }

        process.exit(0)
    } catch (error) {
        console.error('Fatal error:', error)
        process.exit(1)
    }
}

addStoreTransactionItemColumns()
