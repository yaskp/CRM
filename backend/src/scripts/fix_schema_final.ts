import { sequelize } from './src/database/connection'

async function checkAndFix() {
    try {
        const [columns]: any = await sequelize.query('SHOW COLUMNS FROM work_order_items')
        const columnNames = columns.map((c: any) => c.Field)
        console.log('Columns directly BEFORE:', JSON.stringify(columnNames))

        if (!columnNames.includes('parent_work_item_type_id')) {
            console.log('Adding parent_work_item_type_id...')
            await sequelize.query('ALTER TABLE work_order_items ADD COLUMN parent_work_item_type_id INT NULL AFTER item_type')
        }

        if (!columnNames.includes('reference_id')) {
            console.log('Adding reference_id...')
            await sequelize.query('ALTER TABLE work_order_items ADD COLUMN reference_id INT NULL AFTER parent_work_item_type_id')
        }

        const [columnsRefreshed]: any = await sequelize.query('SHOW COLUMNS FROM work_order_items')
        const columnNamesRefreshed = columnsRefreshed.map((c: any) => c.Field)
        console.log('Columns directly AFTER:', JSON.stringify(columnNamesRefreshed))

        console.log('DONE')
    } catch (err: any) {
        console.error('FATAL ERROR:', err.message)
    } finally {
        await sequelize.close()
    }
}

checkAndFix()
