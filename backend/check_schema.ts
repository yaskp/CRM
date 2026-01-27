
import { sequelize } from './src/database/connection.ts';
import { QueryTypes } from 'sequelize';

async function checkSchema() {
    try {
        const results = await sequelize.query('DESCRIBE store_transactions', { type: QueryTypes.SELECT });
        console.log(JSON.stringify(results, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkSchema();
