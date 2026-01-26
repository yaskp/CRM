require('dotenv').config({ path: '../../backend/.env' });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function manualFix() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'crm_db',
        multipleStatements: true
    });

    try {
        console.log('🔧 Fixing project statuses...\n');

        const sql = fs.readFileSync(path.join(__dirname, 'manual_fix_three_projects.sql'), 'utf8');
        const [results] = await connection.query(sql);

        console.log('✅ Projects updated!\n');

        // Get the SELECT results (last result set)
        const rows = Array.isArray(results) ? results[results.length - 1] : results;

        console.log('📊 Current Status:');
        console.log('═'.repeat(100));

        let currentProject = null;
        rows.forEach(row => {
            if (currentProject !== row.id) {
                if (currentProject !== null) console.log('─'.repeat(100));
                console.log(`\n🏗️  ${row.project_code}: ${row.name}`);
                console.log(`   Project Status: ${row.project_status}`);
                currentProject = row.id;
            }
            if (row.work_order_number) {
                console.log(`   └─ ${row.work_order_number}: ${row.wo_status}`);
            }
        });
        console.log('\n' + '═'.repeat(100));

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

manualFix();
