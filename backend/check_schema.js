
import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME || 'crm_construction',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        dialect: 'mysql',
        logging: false
    }
);

async function checkSchema() {
    try {
        const tableInfo = await sequelize.getQueryInterface().describeTable('annexures');

        console.log("--- Schema Check Results ---");
        console.log("Column 'scope_matrix' exists:", !!tableInfo.scope_matrix);
        if (tableInfo.scope_matrix) {
            console.log("Column 'scope_matrix' details:", JSON.stringify(tableInfo.scope_matrix, null, 2));
        }

        console.log("Column 'type' details:", JSON.stringify(tableInfo.type, null, 2));

        // Check if 'scope_matrix' is in ENUM
        const [results] = await sequelize.query("SHOW COLUMNS FROM annexures LIKE 'type'");
        console.log("Type raw definition:", results[0].Type);

        process.exit(0);
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

checkSchema();
