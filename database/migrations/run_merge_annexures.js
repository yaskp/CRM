const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });

async function runMerge() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'crm_construction',
            multipleStatements: false
        });

        console.log('Connected to database');
        const sqlFile = fs.readFileSync(path.join(__dirname, 'merge_annexure_masters.sql'), 'utf8');

        const statements = sqlFile.split(';').map(s => s.trim()).filter(s => s.length > 0);

        for (const statement of statements) {
            try {
                await connection.query(statement);
                console.log(`Executed: ${statement.substring(0, 50)}...`);
            } catch (error) {
                if (error.errno === 1060 || error.errno === 1061 || error.errno === 1022 || error.errno === 1050 || error.errno === 1091) {
                    console.log(`Skipping: ${error.message}`);
                } else {
                    console.error(`Statement failed: ${statement}`);
                    console.error('Error:', error.message, 'Errno:', error.errno);
                    throw error;
                }
            }
        }

        console.log('✓ Annexure Master merge completed successfully');

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

runMerge();
