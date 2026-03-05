import { sequelize } from './src/database/connection.js';

async function run() {
    try {
        await sequelize.authenticate();
        console.log('connected');
        await sequelize.query(`ALTER TABLE work_orders 
            ADD COLUMN quotation_id INT NULL REFERENCES quotations(id), 
            ADD COLUMN client_scope TEXT NULL, 
            ADD COLUMN contractor_scope TEXT NULL, 
            ADD COLUMN quote_type ENUM('with_material','labour_only') NULL DEFAULT 'with_material', 
            ADD COLUMN boq_id INT NULL, 
            ADD COLUMN created_by INT NULL;`);
        console.log('success');
    } catch (e: any) {
        if (e.message.includes('Duplicate column')) {
            console.log('columns already exist');
        } else {
            console.error(e.message);
        }
    } finally {
        process.exit(0);
    }
}
run();
