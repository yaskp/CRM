require('dotenv').config({ path: '../../backend/.env' });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function updateClientGroups() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'crm_db',
        multipleStatements: true
    });

    try {
        console.log('🔧 Updating Client Groups with company names...\n');

        const sql = fs.readFileSync(path.join(__dirname, '012_update_client_groups_data.sql'), 'utf8');
        await connection.query(sql);

        console.log('✅ Client Groups updated successfully!\n');
        console.log('📊 Sample Company Groups:');
        console.log('   - Rajhans Group');
        console.log('   - Raghuver Group');
        console.log('   - Adani Group');
        console.log('   - Tata Projects');
        console.log('   - L&T Construction\n');

    } catch (error) {
        console.error('❌ Update failed:', error.message);
    } finally {
        await connection.end();
    }
}

updateClientGroups();
