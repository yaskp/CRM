import { sequelize } from './database/connection';

const run = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected');
        await sequelize.query(`
      ALTER TABLE warehouses 
      ADD COLUMN type ENUM('central', 'site') DEFAULT 'central';
    `);
        console.log('Column added');
    } catch (err: any) {
        if (err.message && err.message.includes("Duplicate column name")) {
            console.log("Column already exists");
        } else {
            console.error(err);
        }
    } finally {
        await sequelize.close();
    }
};
run();
