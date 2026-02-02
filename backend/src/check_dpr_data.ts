import { sequelize } from './database/connection'
import './models/index'
import { QueryTypes } from 'sequelize'

const checkDPRData = async () => {
    try {
        await sequelize.authenticate()
        console.log('Connection has been established successfully.')

        const materials = await sequelize.query(`SELECT id, name, material_code FROM materials`, { type: QueryTypes.SELECT })
        console.log('\n--- MATERIALS ---')
        console.table(materials)

        const dprs = await sequelize.query(`
            SELECT id, transaction_date, manpower_data, remarks 
            FROM store_transactions 
            WHERE transaction_type = 'CONSUMPTION' 
            LIMIT 10
        `, { type: QueryTypes.SELECT })

        console.log('\n--- DPR MANPOWER DATA ---')
        dprs.forEach((d: any) => {
            console.log(`DPR ID: ${d.id}, Date: ${d.transaction_date}`)
            console.log(`Manpower: ${d.manpower_data}`)
        })

        const itemConsumption = await sequelize.query(`
            SELECT sti.id, sti.transaction_id, m.name as material_name, m.material_code, sti.quantity, sti.unit
            FROM store_transaction_items sti
            JOIN materials m ON sti.material_id = m.id
            JOIN store_transactions st ON sti.transaction_id = st.id
            WHERE st.transaction_type = 'CONSUMPTION'
            LIMIT 30
        `, { type: QueryTypes.SELECT })
        console.log('\n--- ITEM CONSUMPTION ---')
        console.table(itemConsumption)

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await sequelize.close()
    }
}

checkDPRData()
