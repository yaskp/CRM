const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });

async function addRemarksToWorkOrder() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'crm_construction'
        });

        console.log('Connected to database.');

        try {
            await connection.execute(`ALTER TABLE work_orders ADD COLUMN remarks TEXT NULL`);
            console.log(`Executed: ADD COLUMN remarks`);
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log(`Column remarks already exists (skipped)`);
            } else {
                console.error(`Error adding column: remarks`, error.message);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

addRemarksToWorkOrder();
