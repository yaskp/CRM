
import { sequelize } from '../src/database/connection';

async function updatePOSchema() {
    try {
        const queryInterface = sequelize.getQueryInterface();
        const tableInfo = await queryInterface.describeTable('purchase_orders');

        if (!tableInfo['annexure_id']) {
            await sequelize.query(`
        ALTER TABLE purchase_orders
        ADD COLUMN annexure_id INT NULL,
        ADD INDEX idx_po_annexure (annexure_id);
      `);
            console.log('Added annexure_id');
        }

        if (!tableInfo['warehouse_id']) {
            await sequelize.query(`
        ALTER TABLE purchase_orders
        ADD COLUMN warehouse_id INT NULL,
        ADD INDEX idx_po_warehouse (warehouse_id);
      `);
            console.log('Added warehouse_id');
        }

        if (!tableInfo['delivery_type']) {
            await sequelize.query(`
        ALTER TABLE purchase_orders
        ADD COLUMN delivery_type ENUM('direct_to_site', 'central_warehouse', 'mixed') DEFAULT 'central_warehouse';
      `);
            console.log('Added delivery_type');
        }

        if (!tableInfo['gst_type']) {
            await sequelize.query(`
        ALTER TABLE purchase_orders
        ADD COLUMN gst_type ENUM('intra_state', 'inter_state') NULL;
      `);
            console.log('Added gst_type');
        }

        if (!tableInfo['cgst_amount']) {
            await sequelize.query(`
        ALTER TABLE purchase_orders
        ADD COLUMN cgst_amount DECIMAL(15,2) DEFAULT 0,
        ADD COLUMN sgst_amount DECIMAL(15,2) DEFAULT 0,
        ADD COLUMN igst_amount DECIMAL(15,2) DEFAULT 0;
      `);
            console.log('Added GST amount columns');
        }

        if (!tableInfo['company_state_code']) {
            await sequelize.query(`
        ALTER TABLE purchase_orders
        ADD COLUMN company_state_code VARCHAR(2) NULL,
        ADD COLUMN vendor_state_code VARCHAR(2) NULL;
      `);
            console.log('Added state code columns');
        }

        if (!tableInfo['temp_number']) {
            await sequelize.query(`
          ALTER TABLE purchase_orders
          ADD COLUMN temp_number VARCHAR(50) NULL AFTER id;
        `);
            console.log('Added temp_number');
        }

        if (!tableInfo['boq_id']) {
            await sequelize.query(`
          ALTER TABLE purchase_orders
          ADD COLUMN boq_id INT NULL;
        `);
            console.log('Added boq_id');
        }

        console.log('Purchase Order schema update complete');
    } catch (error) {
        console.error('Schema update failed:', error);
    } finally {
        process.exit();
    }
}

updatePOSchema();
