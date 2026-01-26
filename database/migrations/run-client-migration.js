require('dotenv').config({ path: '../../backend/.env' });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'crm_db',
        multipleStatements: true
    });

    try {
        console.log('Starting client management migration...');
        const sql = fs.readFileSync(path.join(__dirname, '010_create_clients_table.sql'), 'utf8');

        // Execute the SQL
        await connection.query(sql);

        console.log('✅ Client management migration completed successfully.');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

runMigration();
