import { sequelize } from './database/connection'
import { QueryTypes } from 'sequelize'

async function debug() {
    try {
        const items = await sequelize.query(`
            SELECT 
                sti.transaction_id,
                st.status,
                st.transaction_type,
                m.name as material_name,
                wit.name as work_type_name,
                sti.quantity
            FROM store_transaction_items sti
            LEFT JOIN materials m ON sti.material_id = m.id
            LEFT JOIN work_item_types wit ON sti.work_item_type_id = wit.id
            LEFT JOIN store_transactions st ON sti.transaction_id = st.id
            WHERE st.project_id = 5
        `, { type: QueryTypes.SELECT })
        console.log(JSON.stringify(items, null, 2))
    } finally {
        await sequelize.close()
    }
}
debug()
