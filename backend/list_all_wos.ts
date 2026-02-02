
import { sequelize } from './src/database/connection'
import WorkOrder from './src/models/WorkOrder'
import './src/models/index'

const checkWorkOrders = async () => {
    try {
        await sequelize.authenticate()
        const allWOs = await WorkOrder.findAll()
        console.log('---START---')
        console.log(`TOTAL_COUNT: ${allWOs.length}`)
        allWOs.forEach(wo => {
            console.log(`WO_DATA: ID=${wo.id}, NUM=${wo.work_order_number}, PROJ=${wo.project_id}, VENDOR=${(wo as any).vendor_id}`)
        })
        console.log('---END---')
    } catch (error) {
        console.error('Error:', error)
    } finally {
        await sequelize.close()
    }
}
checkWorkOrders()
