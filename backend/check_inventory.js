import { sequelize } from './src/database/connection.js';

async function checkTable() {
    try {
        const [results] = await sequelize.query('DESCRIBE inventory');
        console.log(JSON.stringify(results, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkTable();
