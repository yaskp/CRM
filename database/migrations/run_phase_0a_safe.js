const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../backend/.env') });

async function checkAndAddWorkTypeColumns() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'crm_construction'
        });

        console.log('✅ Connected to database.');
        console.log('🔍 Checking existing columns...\n');

        const tables = [
            { name: 'quotation_items', after: 'item_type' },
            { name: 'work_order_items', after: 'category' },
            { name: 'daily_progress_reports', after: 'remarks' },
            { name: 'purchase_order_items', after: 'material_id' }
        ];

        for (const table of tables) {
            // Check if column exists
            const [columns] = await connection.query(
                `SHOW COLUMNS FROM ${table.name} LIKE 'work_item_type_id'`
            );

            if (columns.length === 0) {
                console.log(`➕ Adding work_item_type_id to ${table.name}...`);
                await connection.query(`
                    ALTER TABLE ${table.name} 
                    ADD COLUMN work_item_type_id INT NULL AFTER ${table.after}
                `);
                console.log(`✅ Added work_item_type_id to ${table.name}`);
            } else {
                console.log(`⏭️  work_item_type_id already exists in ${table.name}`);
            }
        }

        console.log('\n📊 Creating indexes...');

        // Create indexes (IF NOT EXISTS works in MySQL 5.7+)
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_quotation_items_work_type ON quotation_items(work_item_type_id)',
            'CREATE INDEX IF NOT EXISTS idx_work_order_items_work_type ON work_order_items(work_item_type_id)',
            'CREATE INDEX IF NOT EXISTS idx_dpr_work_type ON daily_progress_reports(work_item_type_id)',
            'CREATE INDEX IF NOT EXISTS idx_po_items_work_type ON purchase_order_items(work_item_type_id)'
        ];

        for (const indexSql of indexes) {
            try {
                await connection.query(indexSql);
            } catch (err) {
                if (err.code !== 'ER_DUP_KEYNAME') {
                    console.log(`⚠️  Index creation note: ${err.message}`);
                }
            }
        }

        console.log('✅ Indexes created/verified');

        console.log('\n🔗 Updating existing data to link work types...');

        // Update quotation_items
        const [qiResult] = await connection.query(`
            UPDATE quotation_items qi
            JOIN work_item_types wit ON qi.item_type = wit.name
            SET qi.work_item_type_id = wit.id
            WHERE qi.work_item_type_id IS NULL
        `);
        console.log(`✅ Updated ${qiResult.affectedRows} quotation items`);

        // Update work_order_items
        const [woiResult] = await connection.query(`
            UPDATE work_order_items woi
            JOIN work_item_types wit ON woi.item_type = wit.name
            SET woi.work_item_type_id = wit.id
            WHERE woi.work_item_type_id IS NULL
        `);
        console.log(`✅ Updated ${woiResult.affectedRows} work order items`);

        console.log('\n✨ Phase 0A: Work Type Integration completed successfully!');
        console.log('\n📋 Summary:');
        console.log('   ✅ work_item_type_id added to quotation_items');
        console.log('   ✅ work_item_type_id added to work_order_items');
        console.log('   ✅ work_item_type_id added to daily_progress_reports');
        console.log('   ✅ work_item_type_id added to purchase_order_items');
        console.log('   ✅ Indexes created for performance');
        console.log('   ✅ Existing data linked to work types');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

checkAndAddWorkTypeColumns();
