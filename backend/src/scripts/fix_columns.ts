import { sequelize } from './src/database/connection'

async function checkAndFix() {
    try {
        const [columns]: any = await sequelize.query('SHOW COLUMNS FROM work_order_items')
        const columnNames = columns.map((c: any) => c.Field)
        console.log('Current columns:', columnNames)

        if (!columnNames.includes('parent_work_item_type_id')) {
            console.log('Adding parent_work_item_type_id...')
            await sequelize.query('ALTER TABLE work_order_items ADD COLUMN parent_work_item_type_id INT NULL AFTER item_type')
        }

        if (!columnNames.includes('reference_id')) {
            console.log('Adding reference_id...')
            await sequelize.query('ALTER TABLE work_order_items ADD COLUMN reference_id INT NULL AFTER parent_work_item_type_id')
        }

        // Add FK constraint if not exists (assume name for now)
        try {
            await sequelize.query(`
        ALTER TABLE work_order_items 
        ADD CONSTRAINT fk_work_order_items_parent_type 
        FOREIGN KEY (parent_work_item_type_id) REFERENCES work_item_types(id)
      `)
            console.log('FK constraint added')
        } catch (e: any) {
            console.log('FK constraint might already exist or error:', e.message)
        }

        console.log('DONE')
    } catch (err: any) {
        console.error('FATAL ERROR:', err.message)
    } finally {
        await sequelize.close()
    }
}

checkAndFix()
