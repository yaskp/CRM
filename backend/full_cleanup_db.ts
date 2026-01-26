import { sequelize } from './src/database/connection.js';

async function fullCleanup() {
    const tables = [
        // 1. Transactional Flow
        'leads',
        'quotation_items',
        'quotations',
        'work_order_items',
        'work_orders',

        // 2. Project Hierarchy
        'project_zones',
        'project_floors',
        'project_buildings',
        'project_documents',
        'project_milestones',
        'project_contacts',
        'project_details',
        'project_vendors',
        'project_boq_items',
        'project_boqs',
        'projects',

        // 3. Client Data
        'client_contacts',
        'client_groups',
        'clients',

        // 4. Procurement & Inventory
        'inventory_ledger',
        'inventory',
        'store_transaction_items',
        'store_transactions',
        'purchase_order_items',
        'purchase_orders',
        'material_requisition_items',
        'requisitions',

        // 5. Site Construction Data
        'manpower_reports',
        'daily_progress_reports',
        'bar_bending_schedules',
        'equipment_breakdowns',
        'equipment_rentals',
        'expense_approvals',
        'expenses',
        'panel_progress',
        'drawing_panels',
        'drawings',

        // 6. System Logs
        'notifications'
    ];

    try {
        console.log('--- STARTING FULL DATABASE RESET ---');
        console.log('Disabling foreign key checks...');
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

        for (const table of tables) {
            try {
                console.log(`Cleaning table: ${table}...`);
                await sequelize.query(`TRUNCATE TABLE ${table}`);
            } catch (err: any) {
                console.warn(`Could not truncate ${table}: ${err.message}`);
            }
        }

        // Special handling for Site Warehouses (optional but cleaner)
        console.log('Cleaning site-specific warehouses...');
        await sequelize.query("DELETE FROM warehouses WHERE type != 'central'");

        console.log('Enabling foreign key checks...');
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('--- RESET COMPLETE! ---');
        console.log('The following Master Data is still intact:');
        console.log(' - Users & Roles (Keep your login)');
        console.log(' - Materials Catalog');
        console.log(' - Central Warehouse');
        console.log(' - Vendors Master');
        console.log(' - Work Types & Units Master');

        process.exit(0);
    } catch (err) {
        console.error('Cleanup failed:', err);
        process.exit(1);
    }
}

fullCleanup();
