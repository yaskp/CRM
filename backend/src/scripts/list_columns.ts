
import { Sequelize } from 'sequelize';

async function listColumns() {
    const sequelize = new Sequelize('crm_construction', 'root', 'root', {
        host: 'localhost',
        dialect: 'mysql',
        logging: false
    });

    try {
        const [results] = await sequelize.query("SHOW COLUMNS FROM store_transactions;");
        const columnNames = results.map((c: any) => c.Field);
        console.log("Columns in store_transactions:");
        console.log(columnNames.join(', '));
    } catch (error) {
        console.error("Error:", error.message);
    } finally {
        await sequelize.close();
    }
}

listColumns();
