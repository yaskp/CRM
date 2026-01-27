
import { sequelize } from './src/database/connection.ts';
import { QueryTypes } from 'sequelize';

async function fixConsumption() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected');

        // Update ID 5 to have drawing_panel_id = 3
        await sequelize.query(
            "UPDATE store_transactions SET drawing_panel_id = 3 WHERE id = 5",
            { type: QueryTypes.UPDATE }
        );

        console.log('Updated transaction 5 with drawing_panel_id = 3');

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

fixConsumption();
