
import { sequelize } from '../database/connection';

async function checkColumns() {
    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query("SHOW COLUMNS FROM drawing_panels LIKE 'length'");

        if (results.length > 0) {
            console.log('VERIFICATION SUCCESS: Column "length" exists.');
        } else {
            console.log('VERIFICATION FAILED: Column "length" does NOT exist.');
        }
    } catch (error) {
        console.error('Error checking columns:', error);
    } finally {
        await sequelize.close();
    }
}

checkColumns();
