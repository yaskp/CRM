
import { Sequelize, DataTypes } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const sequelize = new Sequelize(
    process.env.DB_NAME!,
    process.env.DB_USER!,
    process.env.DB_PASSWORD!,
    {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '3306'),
        dialect: 'mysql',
        logging: console.log
    }
);

async function runMigration() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        // 1. Create warehouses table if it doesn't exist
        console.log('Checking for warehouses table...');
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS warehouses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                code VARCHAR(20) NOT NULL UNIQUE,
                type ENUM('central', 'site') DEFAULT 'central',
                address TEXT,
                company_id INT NULL,
                is_common TINYINT(1) DEFAULT 0,
                warehouse_manager_id INT NULL,
                project_id INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX (project_id),
                INDEX (warehouse_manager_id)
            ) ENGINE=InnoDB;
        `);
        console.log('✅ warehouses table ensured.');

        // 2. Add warehouse_id to purchase_orders
        console.log('Checking for warehouse_id in purchase_orders...');
        const [poCols] = await sequelize.query(`SHOW COLUMNS FROM purchase_orders LIKE 'warehouse_id'`);
        if ((poCols as any[]).length === 0) {
            await sequelize.query(`ALTER TABLE purchase_orders ADD COLUMN warehouse_id INT NULL AFTER project_id`);
            console.log('✅ Added warehouse_id to purchase_orders');
        } else {
            console.log('⏭️  warehouse_id already exists in purchase_orders');
        }

        // 3. Update store_transactions
        console.log('Checking for columns in store_transactions...');
        const [stCols] = await sequelize.query(`SHOW COLUMNS FROM store_transactions`);
        const stColNames = (stCols as any[]).map(c => c.Field);

        if (!stColNames.includes('source_type')) {
            await sequelize.query(`ALTER TABLE store_transactions ADD COLUMN source_type ENUM('warehouse', 'project', 'vendor') DEFAULT 'warehouse' AFTER transaction_type`);
        }
        if (!stColNames.includes('destination_type')) {
            await sequelize.query(`ALTER TABLE store_transactions ADD COLUMN destination_type ENUM('warehouse', 'project', 'vendor') DEFAULT 'warehouse' AFTER source_type`);
        }
        if (!stColNames.includes('to_warehouse_id')) {
            await sequelize.query(`ALTER TABLE store_transactions ADD COLUMN to_warehouse_id INT NULL AFTER warehouse_id`);
        }
        if (!stColNames.includes('from_project_id')) {
            await sequelize.query(`ALTER TABLE store_transactions ADD COLUMN from_project_id INT NULL AFTER to_warehouse_id`);
        }
        if (!stColNames.includes('to_project_id')) {
            await sequelize.query(`ALTER TABLE store_transactions ADD COLUMN to_project_id INT NULL AFTER from_project_id`);
        }
        console.log('✅ store_transactions columns ensured.');

        // 4. Create inventory table if it doesn't exist
        console.log('Checking for inventory table...');
        await sequelize.query(`
            CREATE TABLE IF NOT EXISTS inventory (
                id INT AUTO_INCREMENT PRIMARY KEY,
                warehouse_id INT NOT NULL,
                material_id INT NOT NULL,
                quantity DECIMAL(15, 2) DEFAULT 0,
                reserved_quantity DECIMAL(15, 2) DEFAULT 0,
                min_stock_level DECIMAL(15, 2) DEFAULT 0,
                max_stock_level DECIMAL(15, 2) DEFAULT 0,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY unique_warehouse_material (warehouse_id, material_id),
                INDEX (material_id)
            ) ENGINE=InnoDB;
        `);
        console.log('✅ inventory table ensured.');

        // 5. Seed a default central warehouse if none exists
        const [warehouses] = await sequelize.query(`SELECT id FROM warehouses LIMIT 1`);
        if ((warehouses as any[]).length === 0) {
            await sequelize.query(`
                INSERT INTO warehouses (name, code, type, is_common) 
                VALUES ('Main Central Warehouse', 'WH-CENTRAL', 'central', 1)
            `);
            console.log('✅ Default warehouse seeded.');
        }

        console.log('\n🚀 Phase 0B Migration completed successfully!');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await sequelize.close();
    }
}

runMigration();
