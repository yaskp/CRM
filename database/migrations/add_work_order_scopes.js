const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });

async function addWorkOrderFields() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'crm_construction'
        });

        console.log('Connected to database.');

        // Add columns if they don't exist
        const columnsToAdd = [
            "ADD COLUMN client_scope TEXT NULL",
            "ADD COLUMN contractor_scope TEXT NULL",
            "ADD COLUMN terms_conditions TEXT NULL"
        ];

        for (const col of columnsToAdd) {
            try {
                await connection.execute(`ALTER TABLE work_orders ${col}`);
                console.log(`Executed: ${col}`);
            } catch (error) {
                if (error.code === 'ER_DUP_FIELDNAME') {
                    console.log(`Column already exists (skipped): ${col}`);
                } else {
                    console.error(`Error adding column: ${col}`, error.message);
                }
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

addWorkOrderFields();
