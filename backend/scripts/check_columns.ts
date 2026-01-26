
import { sequelize } from '../src/database/connection';

const checkColumns = async () => {
    try {
        await sequelize.authenticate();
        const [results] = await sequelize.query("DESCRIBE clients");
        console.log('Columns in clients table:');
        console.table(results);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkColumns();
