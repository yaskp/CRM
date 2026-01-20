const mysql = require('mysql2/promise')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') })

async function addVendorFields() {
    let connection

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'crm_construction',
        })

        console.log('Connected to database')

        const checkColumn = async (colName) => {
            const [rows] = await connection.query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'store_transactions' AND COLUMN_NAME = ?
            `, [process.env.DB_NAME || 'crm_construction', colName])
            return rows.length > 0
        }

        if (!(await checkColumn('vendor_id'))) {
            await connection.query("ALTER TABLE store_transactions ADD COLUMN vendor_id INT NULL AFTER to_project_id")
            console.log('✓ Added vendor_id')
        }

        if (!(await checkColumn('purchase_order_id'))) {
            await connection.query("ALTER TABLE store_transactions ADD COLUMN purchase_order_id INT NULL AFTER vendor_id")
            console.log('✓ Added purchase_order_id')
        } else {
            console.log('- purchase_order_id already exists')
        }

    } catch (error) {
        console.error('Migration failed:', error.message)
        process.exit(1)
    } finally {
        if (connection) {
            await connection.end()
        }
    }
}

addVendorFields()
