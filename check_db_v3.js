require('dotenv').config({ path: './backend/.env' });
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false
    }
);

async function checkTables() {
    try {
        const vendors = await sequelize.getQueryInterface().describeTable('vendors');
        console.log('--- VENDORS ---');
        console.log(Object.keys(vendors));

        const projects = await sequelize.getQueryInterface().describeTable('projects');
        console.log('--- PROJECTS ---');
        console.log(Object.keys(projects));

        const po = await sequelize.getQueryInterface().describeTable('purchase_orders');
        console.log('--- PURCHASE ORDERS ---');
        console.log(Object.keys(po));

        const st = await sequelize.getQueryInterface().describeTable('store_transactions');
        console.log('--- STORE TRANSACTIONS ---');
        console.log(Object.keys(st));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkTables();
