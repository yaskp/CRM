require('dotenv').config({ path: '../../backend/.env' });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function addGroupType() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'crm_db',
        multipleStatements: true
    });

    try {
        console.log('🔧 Adding group_type to client_groups...\n');

        const sql = fs.readFileSync(path.join(__dirname, '013_add_group_type_to_client_groups.sql'), 'utf8');
        await connection.query(sql);

        console.log('✅ Migration completed successfully!\n');
        console.log('📊 Group Types Available:');
        console.log('   - Corporate (Large companies)');
        console.log('   - SME (Small & Medium Enterprises)');
        console.log('   - Government');
        console.log('   - Individual');
        console.log('   - Retail\n');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        await connection.end();
    }
}

addGroupType();
