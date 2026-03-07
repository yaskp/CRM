import { sequelize } from './src/database/connection'

async function runSql() {
    try {
        await sequelize.query(`
      ALTER TABLE work_order_items 
      ADD COLUMN parent_work_item_type_id INT NULL AFTER item_type,
      ADD COLUMN reference_id INT NULL AFTER parent_work_item_type_id,
      ADD CONSTRAINT fk_work_order_items_parent_type 
      FOREIGN KEY (parent_work_item_type_id) REFERENCES work_item_types(id)
    `)
        console.log('Migration SUCCESS')
    } catch (err: any) {
        console.error('Migration FAILURE:', err.message)
        if (err.original) console.error('Original error:', err.original.message)
    } finally {
        await sequelize.close()
    }
}

runSql()
