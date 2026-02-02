import { sequelize } from './database/connection'
import { QueryTypes } from 'sequelize'

async function debug() {
    try {
        console.log('--- ITEMS FOR TRANSACTION 12 ---')
        const items = await sequelize.query(`
            SELECT sti.*, m.name as material_name, m.material_code 
            FROM store_transaction_items sti 
            LEFT JOIN materials m ON sti.material_id = m.id 
            WHERE sti.transaction_id = 12
        `, { type: QueryTypes.SELECT })
        console.table(items)
    } catch (e) {
        console.error(e)
    } finally {
        await sequelize.close()
    }
}
debug()
