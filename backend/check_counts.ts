import { sequelize } from './src/database/connection.js';

async function check() {
    try {
        const [leads] = await sequelize.query('SELECT COUNT(*) as count FROM leads');
        const [projects] = await sequelize.query('SELECT COUNT(*) as count FROM projects');
        const [clients] = await sequelize.query('SELECT COUNT(*) as count FROM clients');
        const [mats] = await sequelize.query('SELECT COUNT(*) as count FROM materials');
        const [quotes] = await sequelize.query('SELECT COUNT(*) as count FROM quotations');
        console.log(JSON.stringify({
            leads: leads[0].count,
            projects: projects[0].count,
            clients: clients[0].count,
            materials: mats[0].count,
            quotations: quotes[0].count
        }, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
