import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const sequelize = new Sequelize(
    process.env.DB_NAME!,
    process.env.DB_USER!,
    process.env.DB_PASSWORD!,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: console.log,
    }
);

async function runMigration() {
    try {
        console.log('--- Starting Phase 0C Migration (GST & Numbering) ---');

        // 1. Update Warehouses table
        console.log('Updating warehouses table...');
        await sequelize.query(`ALTER TABLE warehouses ADD COLUMN city VARCHAR(100) AFTER address`);
        await sequelize.query(`ALTER TABLE warehouses ADD COLUMN state VARCHAR(100) AFTER city`);
        await sequelize.query(`ALTER TABLE warehouses ADD COLUMN state_code VARCHAR(2) AFTER state`);
        await sequelize.query(`ALTER TABLE warehouses ADD COLUMN pincode VARCHAR(10) AFTER state_code`);
        await sequelize.query(`ALTER TABLE warehouses ADD COLUMN incharge_name VARCHAR(100) AFTER pincode`);
        await sequelize.query(`ALTER TABLE warehouses ADD COLUMN incharge_phone VARCHAR(20) AFTER incharge_name`);

        // 2. Update Vendors table
        console.log('Updating vendors table...');
        await sequelize.query(`ALTER TABLE vendors ADD COLUMN state_code VARCHAR(2) AFTER address`);

        // 3. Update Projects table
        console.log('Updating projects table...');
        await sequelize.query(`ALTER TABLE projects ADD COLUMN site_state_code VARCHAR(2) AFTER client_gstin`);

        // 4. Update Purchase Orders table
        console.log('Updating purchase_orders table...');
        await sequelize.query(`ALTER TABLE purchase_orders ADD COLUMN gst_type ENUM('intra_state', 'inter_state') AFTER total_amount`);
        await sequelize.query(`ALTER TABLE purchase_orders ADD COLUMN cgst_amount DECIMAL(15, 2) DEFAULT 0 AFTER gst_type`);
        await sequelize.query(`ALTER TABLE purchase_orders ADD COLUMN sgst_amount DECIMAL(15, 2) DEFAULT 0 AFTER cgst_amount`);
        await sequelize.query(`ALTER TABLE purchase_orders ADD COLUMN igst_amount DECIMAL(15, 2) DEFAULT 0 AFTER sgst_amount`);
        await sequelize.query(`ALTER TABLE purchase_orders ADD COLUMN company_state_code VARCHAR(2) AFTER igst_amount`);
        await sequelize.query(`ALTER TABLE purchase_orders ADD COLUMN vendor_state_code VARCHAR(2) AFTER company_state_code`);
        await sequelize.query(`ALTER TABLE purchase_orders ADD COLUMN delivery_type ENUM('direct_to_site', 'central_warehouse', 'mixed') DEFAULT 'central_warehouse' AFTER vendor_state_code`);

        // 5. Update Store Transactions (GRN/STN) table
        console.log('Updating store_transactions table...');
        await sequelize.query(`ALTER TABLE store_transactions ADD COLUMN temp_number VARCHAR(50) AFTER transaction_number`);
        await sequelize.query(`ALTER TABLE store_transactions ADD COLUMN cgst_amount DECIMAL(15, 2) DEFAULT 0 AFTER temp_number`);
        await sequelize.query(`ALTER TABLE store_transactions ADD COLUMN sgst_amount DECIMAL(15, 2) DEFAULT 0 AFTER cgst_amount`);
        await sequelize.query(`ALTER TABLE store_transactions ADD COLUMN igst_amount DECIMAL(15, 2) DEFAULT 0 AFTER sgst_amount`);
        await sequelize.query(`ALTER TABLE store_transactions ADD COLUMN truck_number VARCHAR(50) AFTER approved_by`);
        await sequelize.query(`ALTER TABLE store_transactions ADD COLUMN driver_name VARCHAR(100) AFTER truck_number`);
        await sequelize.query(`ALTER TABLE store_transactions ADD COLUMN driver_phone VARCHAR(20) AFTER driver_name`);
        await sequelize.query(`ALTER TABLE store_transactions ADD COLUMN quality_check_status ENUM('pending', 'passed', 'failed', 'partial') DEFAULT 'pending' AFTER driver_phone`);

        console.log('--- Phase 0C Migration Completed Successfully ---');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await sequelize.close();
    }
}

runMigration();
