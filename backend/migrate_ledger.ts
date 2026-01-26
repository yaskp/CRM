import { sequelize } from './src/database/connection.js';

async function migrate() {
    try {
        console.log('Altering inventory_ledger.transaction_type to include SRN_IN and SRN_OUT...');
        await sequelize.query(`
      ALTER TABLE inventory_ledger 
      MODIFY COLUMN transaction_type ENUM('GRN', 'STN_IN', 'STN_OUT', 'CONSUMPTION', 'SRN', 'SRN_IN', 'SRN_OUT', 'ADJUSTMENT', 'OPENING')
    `);
        console.log('Migration successful!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
