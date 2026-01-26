const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });

async function addCategoryToWorkOrderItems() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'crm_construction'
        });

        console.log('Connected to database.');

        // Add category column to work_order_items
        try {
            await connection.execute(`
                ALTER TABLE work_order_items 
                ADD COLUMN category ENUM('labour', 'material') DEFAULT 'labour' AFTER item_type
            `);
            console.log(`Executed: ADD COLUMN category to work_order_items`);
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log(`Column category already exists (skipped)`);
            } else {
                console.error(`Error adding column: category`, error.message);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

addCategoryToWorkOrderItems();
