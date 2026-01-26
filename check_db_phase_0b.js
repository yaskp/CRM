
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        logging: false
    }
);

async function checkDatabase() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        const tablesToCheck = ['warehouses', 'purchase_orders', 'store_transactions', 'inventory'];

        for (const tableName of tablesToCheck) {
            const [results] = await sequelize.query(`SHOW TABLES LIKE '${tableName}'`);
            if (results.length > 0) {
                console.log(`\nTable '${tableName}' EXISTS.`);
                const [columns] = await sequelize.query(`SHOW COLUMNS FROM ${tableName}`);
                console.log(`Columns in '${tableName}':`, columns.map(c => c.Field).join(', '));
            } else {
                console.log(`\nTable '${tableName}' DOES NOT EXIST.`);
            }
        }

    } catch (error) {
        console.error('Unable to connect to the database:', error);
    } finally {
        await sequelize.close();
    }
}

checkDatabase();
