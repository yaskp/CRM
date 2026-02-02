
import { sequelize } from './src/database/connection'
import WorkOrder from './src/models/WorkOrder'
import './src/models/index'

const checkWorkOrders = async () => {
    try {
        await sequelize.authenticate()
        console.log('Connection has been established successfully.')

        const count = await WorkOrder.count()
        console.log(`Total WorkOrders found: ${count}`)

        const project5 = await WorkOrder.findAll({ where: { project_id: 5 } })
        console.log(`WorkOrders for Project 5: ${project5.length}`)
        if (project5.length > 0) {
            console.log('Project 5 orders statuses:', project5.map(p => ({ id: p.id, status: p.status, vendor_id: (p as any).vendor_id })))
        }

        const approved = await WorkOrder.findAll({ where: { status: 'approved' } })
        console.log(`Total Approved WorkOrders: ${approved.length}`)

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await sequelize.close()
    }
}

checkWorkOrders()
