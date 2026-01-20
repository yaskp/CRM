const mysql = require('mysql2/promise')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') })

async function migrateSTNTable() {
    let connection

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'crm_construction',
        })

        console.log('Connected to database')

        // Helper to check column existence
        const checkColumn = async (colName) => {
            const [rows] = await connection.query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'store_transactions' AND COLUMN_NAME = ?
            `, [process.env.DB_NAME || 'crm_construction', colName])
            return rows.length > 0
        }

        // 1. Make warehouse_id nullable
        // Note: We might need to handle foreign key constraints carefully, but usually modifying to NULL is safe if no data violates it.
        try {
            console.log('Modifying warehouse_id to be nullable...')
            await connection.query("ALTER TABLE store_transactions MODIFY COLUMN warehouse_id INT NULL")
            console.log('✓ warehouse_id is now nullable')
        } catch (e) {
            console.warn('Warning modifying warehouse_id:', e.message)
        }

        // 2. Add from_project_id
        if (!(await checkColumn('from_project_id'))) {
            await connection.query("ALTER TABLE store_transactions ADD COLUMN from_project_id INT NULL AFTER warehouse_id")
            // Optional: Add FK
            // await connection.query("ALTER TABLE store_transactions ADD CONSTRAINT fk_stn_from_project FOREIGN KEY (from_project_id) REFERENCES projects(id) ON DELETE SET NULL")
            console.log('✓ Added from_project_id')
        } else {
            console.log('- from_project_id already exists')
        }

        // 3. Add to_project_id
        if (!(await checkColumn('to_project_id'))) {
            await connection.query("ALTER TABLE store_transactions ADD COLUMN to_project_id INT NULL AFTER to_warehouse_id")
            // Optional: Add FK
            // await connection.query("ALTER TABLE store_transactions ADD CONSTRAINT fk_stn_to_project FOREIGN KEY (to_project_id) REFERENCES projects(id) ON DELETE SET NULL")
            console.log('✓ Added to_project_id')
        } else {
            console.log('- to_project_id already exists')
        }

        // 4. Add source_type
        if (!(await checkColumn('source_type'))) {
            await connection.query("ALTER TABLE store_transactions ADD COLUMN source_type ENUM('warehouse', 'project', 'vendor') DEFAULT 'warehouse' AFTER transaction_type")
            console.log('✓ Added source_type')
        } else {
            console.log('- source_type already exists')
        }

        // 5. Add destination_type
        if (!(await checkColumn('destination_type'))) {
            await connection.query("ALTER TABLE store_transactions ADD COLUMN destination_type ENUM('warehouse', 'project', 'vendor') DEFAULT 'warehouse' AFTER source_type")
            console.log('✓ Added destination_type')
        } else {
            console.log('- destination_type already exists')
        }

        console.log('\nMigration completed successfully!')

    } catch (error) {
        console.error('Migration failed:', error.message)
        process.exit(1)
    } finally {
        if (connection) {
            await connection.end()
        }
    }
}

migrateSTNTable()
