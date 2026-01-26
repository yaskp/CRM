
import { sequelize } from '../src/database/connection';

const addGstRegisteredColumn = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.query("ALTER TABLE clients ADD COLUMN is_gst_registered BOOLEAN DEFAULT TRUE AFTER gstin");
        console.log('Column is_gst_registered added to clients table.');
        process.exit(0);
    } catch (error) {
        console.error('Failed to add column (it might already exist):', error);
        process.exit(1);
    }
};

addGstRegisteredColumn();
