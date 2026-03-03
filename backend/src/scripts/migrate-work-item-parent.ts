import { sequelize } from '../database/connection';

async function migrate() {
    try {
        await sequelize.query(`
      ALTER TABLE work_template_items 
      ADD COLUMN parent_work_item_type_id INT NULL;
    `).catch(() => console.log('Column may already exist in work_template_items'));

        await sequelize.query(`
      ALTER TABLE quotation_items 
      ADD COLUMN parent_work_item_type_id INT NULL;
    `).catch(() => console.log('Column may already exist in quotation_items'));

        console.log('Migration completed.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit(0);
    }
}

migrate();
