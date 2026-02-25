const { sequelize } = require('./dist/database/connection');

async function updateRequisitionsSchema() {
    try {
        console.log('Updating material_requisitions table schema...');

        // Make from_warehouse_id nullable
        await sequelize.query(`
            ALTER TABLE material_requisitions 
            MODIFY COLUMN from_warehouse_id INT NULL
        `);
        console.log('✓ Made from_warehouse_id nullable');

        // Add purpose field if it doesn't exist
        await sequelize.query(`
            ALTER TABLE material_requisitions 
            ADD COLUMN IF NOT EXISTS purpose TEXT NULL
        `);
        console.log('✓ Added purpose field');

        // Add remarks field if it doesn't exist
        await sequelize.query(`
            ALTER TABLE material_requisitions 
            ADD COLUMN IF NOT EXISTS remarks TEXT NULL
        `);
        console.log('✓ Added remarks field');

        console.log('\n✅ Schema update completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating schema:', error);
        process.exit(1);
    }
}

updateRequisitionsSchema();
