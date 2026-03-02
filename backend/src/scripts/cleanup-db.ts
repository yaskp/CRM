import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize dotenv
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { sequelize } from '../database/connection';
// Import all models to ensure they are registered with the sequelize instance
import '../models/index';

/**
 * DATABASE CLEANUP SCRIPT
 * 
 * This script truncates all operational/transactional data while preserving 
 * master data specified by the user.
 * 
 * Master data categories kept:
 * 1. Material (materials)
 * 2. Work (work_item_types, work_templates)
 * 3. Equipment (equipment)
 * 4. Units (units)
 * 5. Annexure (annexures)
 * 
 * System data kept (Required for application to function):
 * - Users, Roles, Permissions (Authentication)
 * - Companies, Branches (Multitenancy)
 * - States (Tax logic)
 * - SequelizeMeta (Migrations tracker)
 */

const keepTables = [
    'materials',
    'work_item_types',
    'work_templates',
    'work_template_items',
    'equipment',
    'units',
    'annexures',
    'users',
    'roles',
    'permissions',
    'user_roles',
    'role_permissions',
    'companies',
    'company_branches',
    'states',
    'budget_heads',
    'worker_categories',
    'vendor_types',
    'vendors', // Kept because equipment often references vendors
    'vendor_contacts',
    'SequelizeMeta', // Migration history
];

async function cleanup() {
    console.log('--- Starting Database Cleanup ---');

    try {
        await sequelize.authenticate();
        console.log('Connected to database successfully.');

        // Get all table names in the database
        const [results] = await sequelize.query('SHOW TABLES');
        const dbName = process.env.DB_NAME || 'crm_construction';
        const allTables = results.map((row: any) => row[`Tables_in_${dbName}`]);

        console.log(`Found ${allTables.length} tables in database.`);

        // Disable foreign key checks to allow truncation
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        console.log('Disabled foreign key checks.');

        let truncatedCount = 0;
        for (const table of allTables) {
            if (keepTables.includes(table)) {
                console.log(`[KEEP] Preserving master table: ${table}`);
            } else {
                console.log(`[TRUNCATE] Cleaning data in: ${table}...`);
                await sequelize.query(`TRUNCATE TABLE \`${table}\``);
                truncatedCount++;
            }
        }

        // Re-enable foreign key checks
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Enabled foreign key checks.');

        console.log('---------------------------------');
        console.log(`Cleanup completed successfully.`);
        console.log(`Truncated ${truncatedCount} tables.`);
        console.log(`Preserved ${allTables.length - truncatedCount} master/system tables.`);
        console.log('---------------------------------');

    } catch (error) {
        console.error('Cleanup failed:', error);
        // Ensure foreign key checks are re-enabled even on error
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => { });
        process.exit(1);
    } finally {
        await sequelize.close();
        process.exit(0);
    }
}

cleanup();
