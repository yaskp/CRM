import { sequelize } from './database/connection'
import { QueryTypes } from 'sequelize'

async function debug() {
    try {
        console.log('--- D-WALL MATERIALS ---')
        const mats = await sequelize.query(`
            SELECT id, name, material_code 
            FROM materials 
            WHERE LOWER(name) LIKE '%dwall%' 
               OR LOWER(name) LIKE '%d-wall%' 
               OR LOWER(name) LIKE '%bentonite%'
        `, { type: QueryTypes.SELECT })
        console.log(JSON.stringify(mats, null, 2))

        console.log('\n--- D-WALL RELATED TRANSACTIONS ---')
        const items = await sequelize.query(`
            SELECT 
                st.id as st_id, 
                st.transaction_date, 
                st.transaction_type, 
                st.status, 
                st.project_id,
                sti.quantity, 
                m.name as material_name
            FROM store_transactions st
            JOIN store_transaction_items sti ON st.id = sti.transaction_id
            JOIN materials m ON sti.material_id = m.id
            WHERE LOWER(m.name) LIKE '%dwall%' 
               OR LOWER(m.name) LIKE '%d-wall%' 
               OR LOWER(m.name) LIKE '%bentonite%'
        `, { type: QueryTypes.SELECT })
        console.log(JSON.stringify(items, null, 2))

        console.log('\n--- CHECKING ALL RECENT CONSUMPTION ---')
        const recent = await sequelize.query(`
            SELECT st.id, st.transaction_date, st.status, m.name as mat_name
            FROM store_transactions st
            JOIN store_transaction_items sti ON st.id = sti.transaction_id
            JOIN materials m ON sti.material_id = m.id
            WHERE st.transaction_type = 'CONSUMPTION'
            ORDER BY st.id DESC
            LIMIT 10
        `, { type: QueryTypes.SELECT })
        console.log(JSON.stringify(recent, null, 2))

    } finally {
        await sequelize.close()
    }
}
debug()
