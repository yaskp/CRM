require('dotenv').config({ path: '../../backend/.env' });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function fixClientGroupsData() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'crm_db',
        multipleStatements: true
    });

    try {
        console.log('🔧 Fixing client_groups data...\n');

        const sql = fs.readFileSync(path.join(__dirname, '014_fix_client_groups_data.sql'), 'utf8');
        const [results] = await connection.query(sql);

        console.log('✅ Client groups data fixed successfully!\n');
        console.log('📊 Sample Company Groups:');
        console.log('   🏢 Corporate:');
        console.log('      - Rajhans Infrastructure');
        console.log('      - Adani Infrastructure');
        console.log('      - Tata Projects');
        console.log('      - L&T Construction');
        console.log('      - Shapoorji Pallonji');
        console.log('\n   🏭 SME:');
        console.log('      - Raghuver Developers');
        console.log('      - Ambuja Realty');
        console.log('\n   🏛️ Government:');
        console.log('      - Gujarat Government PWD');
        console.log('\n   👤 Individual:');
        console.log('      - Individual Clients');
        console.log('\n   🏪 Retail:');
        console.log('      - Retail Customers\n');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        await connection.end();
    }
}

fixClientGroupsData();
