import { sequelize } from './database/connection'
import { QueryTypes } from 'sequelize'

async function debug() {
    try {
        const mats = await sequelize.query('SELECT id, name, material_code FROM materials', { type: QueryTypes.SELECT })
        console.log('--- ALL MATERIALS ---')
        console.log(JSON.stringify(mats, null, 2))

        const items = await sequelize.query(`
            SELECT sti.id, sti.transaction_id, sti.material_id, sti.quantity, m.name as mat_name, sti.work_item_type_id
            FROM store_transaction_items sti
            LEFT JOIN materials m ON sti.material_id = m.id
            WHERE sti.transaction_id IN (11, 12)
        `, { type: QueryTypes.SELECT })
        console.log('--- ITEMS FOR TX 11, 12 ---')
        console.log(JSON.stringify(items, null, 2))
    } finally {
        await sequelize.close()
    }
}
debug()
