import { sequelize } from './database/connection'
import { QueryTypes } from 'sequelize'

async function debug() {
    try {
        console.log('--- ALL TRANSACTIONS FOR PROJECT 5 ---')
        const txs = await sequelize.query(`
            SELECT 
                st.id, 
                st.transaction_date, 
                st.status, 
                st.transaction_type, 
                m.name as mat_name, 
                sti.quantity,
                m.id as mat_id
            FROM store_transactions st
            JOIN store_transaction_items sti ON st.id = sti.transaction_id
            LEFT JOIN materials m ON sti.material_id = m.id
            WHERE st.project_id = 5
            ORDER BY st.transaction_date DESC
        `, { type: QueryTypes.SELECT })
        console.log(JSON.stringify(txs, null, 2))

    } finally {
        await sequelize.close()
    }
}
debug()
