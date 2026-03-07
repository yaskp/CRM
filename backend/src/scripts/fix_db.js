import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME || 'crm_1',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        dialect: 'mysql',
        logging: false
    }
);

async function fix() {
    try {
        console.log('Altering drawing_panel_anchors table...');
        await sequelize.query(`
      ALTER TABLE drawing_panel_anchors 
      MODIFY COLUMN anchor_capacity DECIMAL(10, 2) NULL;
    `);

        console.log('Altering drawing_panels table (legacy column)...');
        await sequelize.query(`
      ALTER TABLE drawing_panels 
      MODIFY COLUMN anchor_capacity DECIMAL(10, 2) NULL;
    `);

        console.log('Success!');
        process.exit(0);
    } catch (err) {
        console.error('Error altering table:', err);
        process.exit(1);
    }
}

fix();
