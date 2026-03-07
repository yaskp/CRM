import { sequelize } from './src/database/connection'

async function tryFix() {
    console.log('DB NAME:', (sequelize as any).config.database)
    try {
        const sql = 'ALTER TABLE work_order_items ADD COLUMN parent_work_item_type_id INT NULL AFTER item_type'
        console.log('Running SQL:', sql)
        const result = await sequelize.query(sql)
        console.log('SQL Result:', result)

        const sql2 = 'ALTER TABLE work_order_items ADD COLUMN reference_id INT NULL AFTER parent_work_item_type_id'
        console.log('Running SQL 2:', sql2)
        const result2 = await sequelize.query(sql2)
        console.log('SQL Result 2:', result2)

        console.log('COMPLETED SUCCESSFULLY')
    } catch (e: any) {
        console.error('FAILED:', e.message)
        if (e.original) console.error('ORIGINAL:', e.original.message)
    } finally {
        await sequelize.close()
    }
}

tryFix()
