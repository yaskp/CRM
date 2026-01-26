import { sequelize } from '../src/database/connection'

async function fixStiColumns() {
    try {
        await sequelize.authenticate()
        console.log('Connected')

        const cols = [
            { name: 'ordered_quantity', type: 'DECIMAL(10, 2) DEFAULT 0' },
            { name: 'accepted_quantity', type: 'DECIMAL(10, 2) DEFAULT 0' },
            { name: 'rejected_quantity', type: 'DECIMAL(10, 2) DEFAULT 0' },
            { name: 'excess_quantity', type: 'DECIMAL(10, 2) DEFAULT 0' },
            { name: 'shortage_quantity', type: 'DECIMAL(10, 2) DEFAULT 0' },
            { name: 'variance_type', type: "ENUM('exact', 'excess', 'shortage', 'defective') DEFAULT 'exact'" },
            { name: 'rejection_reason', type: 'TEXT NULL' },
            { name: 'unit_price', type: 'DECIMAL(15, 2) DEFAULT 0' },
        ]

        for (const col of cols) {
            try {
                await sequelize.query(`
                ALTER TABLE store_transaction_items 
                ADD COLUMN ${col.name} ${col.type}
            `)
                console.log(`Added column ${col.name}`)
            } catch (e: any) {
                console.log(`Skipping ${col.name} (might exist):`, e.original?.sqlMessage || e.message)
            }
        }

        // Also check store_transactions for Challan, Invoice, LR, Eway
        const stCols = [
            { name: 'challan_number', type: 'VARCHAR(100) NULL' },
            { name: 'supplier_invoice_number', type: 'VARCHAR(100) NULL' },
            { name: 'lorry_receipt_number', type: 'VARCHAR(100) NULL' },
            { name: 'eway_bill_number', type: 'VARCHAR(100) NULL' },
        ]

        for (const col of stCols) {
            try {
                await sequelize.query(`
                ALTER TABLE store_transactions 
                ADD COLUMN ${col.name} ${col.type}
            `)
                console.log(`Added st column ${col.name}`)
            } catch (e: any) {
                console.log(`Skipping st ${col.name} (might exist):`, e.original?.sqlMessage || e.message)
            }
        }

        process.exit(0)
    } catch (error) {
        console.error('Fatal error:', error)
        process.exit(1)
    }
}

fixStiColumns()
