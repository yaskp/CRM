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
        const [types] = await sequelize.query('SELECT id, name, parent_id FROM work_item_types');
        console.log('Total types:', types.length);
        const parents = types.filter(t => !t.parent_id);
        console.log('Parents:', parents.length);

        const dwall = parents.find(p => p.name.toLowerCase().includes('d') && p.name.toLowerCase().includes('wal'));
        if (dwall) {
            console.log('Found D Wal:', dwall);
            const children = types.filter(t => t.parent_id === dwall.id);
            console.log('Children of D Wal:', children);
        } else {
            console.log('D Wal Package not found by name filter');
            console.log('Sample parents:', parents.slice(0, 10));
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
