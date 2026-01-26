require('dotenv').config({ path: '../../backend/.env' });
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function fixProjectStatuses() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'crm_db',
        multipleStatements: true
    });

    try {
        console.log('Connected to database');
        console.log('Fixing project statuses based on work order statuses...\n');

        const migrationFile = 'fix_project_statuses_from_work_orders.sql';
        const filePath = path.join(__dirname, migrationFile);
        const sql = fs.readFileSync(filePath, 'utf8');

        console.log(`Running: ${migrationFile}`);
        const [results] = await connection.query(sql);

        console.log('\n✅ Project statuses updated successfully!\n');

        // Show the final results (last result set from the SELECT query)
        const finalResults = Array.isArray(results) ? results[results.length - 1] : results;

        if (finalResults && finalResults.length > 0) {
            console.log('Current Project-WorkOrder Status Mapping:');
            console.log('─'.repeat(80));
            finalResults.forEach(row => {
                console.log(`Project: ${row.project_code} (${row.name})`);
                console.log(`  Project Status: ${row.project_status}`);
                console.log(`  Work Order: ${row.work_order_number || 'None'} - Status: ${row.work_order_status || 'N/A'}`);
                console.log('─'.repeat(80));
            });
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await connection.end();
    }
}

fixProjectStatuses();
