
import { sequelize } from './src/database/connection.ts';
import { QueryTypes } from 'sequelize';

async function checkConsumptions() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected');

        const results = await sequelize.query(
            "SELECT id, transaction_type, drawing_panel_id, transaction_date FROM store_transactions WHERE transaction_type = 'CONSUMPTION'",
            { type: QueryTypes.SELECT }
        );

        console.log('Found Consumptions:', JSON.stringify(results, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkConsumptions();
