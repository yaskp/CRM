const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });

async function checkAnnexures() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'crm_construction'
        });

        console.log('Connected to database.');

        const [rows] = await connection.execute('SELECT id, name, type, clauses FROM annexures');
        console.log("Current Annexures:", JSON.stringify(rows, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

checkAnnexures();
