
import { sequelize } from './src/database/connection'
import WorkOrder from './src/models/WorkOrder'
import './src/models/index'

const checkWorkOrders = async () => {
    try {
        await sequelize.authenticate()
        console.log('Connection has been established successfully.')

        const project5 = await WorkOrder.findAll({ where: { project_id: 5 } })
        console.log(`\n--- WorkOrders for Project 5 (${project5.length} found) ---`)

        project5.forEach(wo => {
            console.log(`ID: ${wo.id}, Number: ${wo.work_order_number}, Status: ${wo.status}, VendorID: ${(wo as any).vendor_id}`)
        })

        const vendor4 = await WorkOrder.findAll({ where: { vendor_id: 4 } })
        console.log(`\n--- WorkOrders for Vendor 4 (${vendor4.length} found) ---`)
        vendor4.forEach(wo => {
            console.log(`ID: ${wo.id}, Number: ${wo.work_order_number}, Status: ${wo.status}, ProjectID: ${wo.project_id}`)
        })

    } catch (error) {
        console.error('Error:', error)
    } finally {
        await sequelize.close()
    }
}

checkWorkOrders()
