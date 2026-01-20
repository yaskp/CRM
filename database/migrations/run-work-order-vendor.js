const { sequelize } = require('../../backend/src/database/connection');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        console.log('Starting migration...');
        const sql = fs.readFileSync(path.join(__dirname, '009_add_vendor_to_work_order.sql'), 'utf8');
        await sequelize.query(sql);
        console.log('Migration completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await sequelize.close();
    }
}

runMigration();
