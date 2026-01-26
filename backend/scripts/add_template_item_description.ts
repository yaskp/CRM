
import { sequelize } from '../src/database/connection';

const addDescriptionColumn = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.query("ALTER TABLE work_template_items ADD COLUMN description TEXT AFTER item_type");
        console.log('Column description added to work_template_items.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed (column might already exist):', error);
        process.exit(1);
    }
};

addDescriptionColumn();
