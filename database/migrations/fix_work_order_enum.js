const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });

async function fixWorkOrderItemEnum() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'crm_construction'
        });

        console.log('Connected to database.');

        // Verify current column type
        const [columns] = await connection.execute("SHOW COLUMNS FROM work_order_items LIKE 'item_type'");
        console.log("Current Column Definition:", columns[0].Type);

        // Update the ENUM definition to include 'Other'
        await connection.execute(`
            ALTER TABLE work_order_items 
            MODIFY COLUMN item_type ENUM('guide_wall', 'grabbing', 'stop_end', 'rubber_stop', 'steel_fabrication', 'anchor', 'anchor_sleeve', 'Other') NOT NULL
        `);
        console.log("Updated item_type ENUM to include 'Other'");

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

fixWorkOrderItemEnum();
