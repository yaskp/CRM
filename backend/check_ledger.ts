import { sequelize } from './src/database/connection.js';

async function checkColumn() {
    try {
        const [results] = await sequelize.query('SHOW FULL COLUMNS FROM inventory_ledger LIKE "transaction_type"');
        console.log(JSON.stringify(results, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkColumn();
