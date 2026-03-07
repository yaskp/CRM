const { Sequelize } = require('sequelize');
require('dotenv').config();

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

async function check() {
    try {
        const [items] = await sequelize.query(`
            SELECT i.work_item_type_id, i.parent_work_item_type_id, i.description 
            FROM work_templates t 
            JOIN work_template_items i ON t.id = i.template_id 
            WHERE t.name = 'D-Wall Package'
        `);
        console.log('Template Items:', JSON.stringify(items, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
