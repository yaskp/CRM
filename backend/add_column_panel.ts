
import { sequelize } from './src/database/connection.ts';
import { QueryTypes } from 'sequelize';

async function addDrawingPanelId() {
    try {
        await sequelize.authenticate();
        console.log('DB Connected');

        // Check if column exists
        const [cols] = await sequelize.query("SHOW COLUMNS FROM store_transactions LIKE 'drawing_panel_id'");
        if (cols.length === 0) {
            console.log('Adding drawing_panel_id column...');
            await sequelize.query("ALTER TABLE store_transactions ADD COLUMN drawing_panel_id INT NULL DEFAULT NULL");
            console.log('Column added.');
        } else {
            console.log('Column already exists.');
        }

    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
}

addDrawingPanelId();
