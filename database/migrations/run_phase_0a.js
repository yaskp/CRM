const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });

async function runPhase0AMigration() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'crm_construction',
            multipleStatements: true
        });

        console.log('✅ Connected to database.');
        console.log('🚀 Starting Phase 0A: Work Type Integration Migration...\n');

        // Read SQL file
        const sqlFile = path.join(__dirname, 'phase_0a_work_type_integration.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        // Execute migration
        await connection.query(sql);

        console.log('✅ Phase 0A Migration completed successfully!');
        console.log('\n📊 Changes applied:');
        console.log('   - Added work_item_type_id to quotation_items');
        console.log('   - Added work_item_type_id to work_order_items');
        console.log('   - Added work_item_type_id to daily_progress_reports');
        console.log('   - Added work_item_type_id to purchase_order_items');
        console.log('   - Created indexes for performance');
        console.log('   - Updated existing data to link work types');
        console.log('\n✨ Work Type Integration is now active!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

runPhase0AMigration();
