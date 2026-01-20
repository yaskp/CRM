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
        console.log('Connected to database');

        const migrationFile = '008_make_lead_project_optional.sql';
        const filePath = path.join(__dirname, migrationFile);
        const sql = fs.readFileSync(filePath, 'utf8');

        console.log(`Running migration: ${migrationFile}`);
        await connection.query(sql);
        console.log('Migration completed successfully');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await connection.end();
    }
}

runMigration();
