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
        console.log('🔧 Running Client Groups and Contacts migration...\n');

        const sql = fs.readFileSync(path.join(__dirname, '011_add_client_groups_and_contacts.sql'), 'utf8');
        await connection.query(sql);

        console.log('✅ Migration completed successfully!\n');
        console.log('📊 Created:');
        console.log('   - client_groups table');
        console.log('   - client_contacts table');
        console.log('   - Added client_group_id to clients table');
        console.log('   - Inserted 5 default client groups\n');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        await connection.end();
    }
}

runMigration();
