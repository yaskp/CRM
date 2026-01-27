
import { sequelize } from './src/database/connection.ts';
import { QueryTypes } from 'sequelize';

async function debugInventory() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        console.log('--- Fetching Raw Transaction Data for Warehouse 11 ---');
        const results = await sequelize.query(`
      SELECT 
        t.transaction_date as date,
        t.transaction_type,
        t.transaction_number,
        t.id as trans_id,
        t.warehouse_id as from_warehouse_id,
        t.to_warehouse_id,
        m.name as material,
        ti.quantity,
        ti.accepted_quantity,
        ti.rejected_quantity,
        ti.item_status
      FROM store_transactions t
      JOIN store_transaction_items ti ON t.id = ti.transaction_id
      JOIN materials m ON ti.material_id = m.id
      WHERE ti.material_id = 3
      ORDER BY t.transaction_date ASC, t.id ASC
    `, { type: QueryTypes.SELECT });

        console.log(JSON.stringify(results, null, 2));

    } catch (error: any) {
        console.error('Error:', error.message);
        if (error.original) console.error('Original Error:', error.original);
        if (error.sql) console.error('SQL:', error.sql);
    } finally {
        process.exit();
    }
}

debugInventory();
