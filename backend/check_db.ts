import { sequelize } from './src/database/connection.js';

const checkQuery = async () => {
    try {
        const [results] = await sequelize.query("SELECT grabbing_depth FROM store_transactions LIMIT 1");
        console.log('Query success:', results);
    } catch (error) {
        console.error('Query Error:', error);
    } finally {
        await sequelize.close();
    }
};

checkQuery();
