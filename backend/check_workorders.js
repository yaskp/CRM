import { sequelize } from './src/database/connection.js'
import WorkOrder from './src/models/WorkOrder.js'

async function checkWorkOrders() {
    try {
        await sequelize.authenticate()
        console.log('Database connected')

        const workOrders = await WorkOrder.findAll({
            limit: 10,
            attributes: ['id', 'project_id', 'vendor_id', 'work_order_number', 'status'],
            raw: true
        })

        console.log('\n=== Work Orders in Database ===')
        console.log(JSON.stringify(workOrders, null, 2))

        console.log('\n=== Summary ===')
        console.log(`Total work orders found: ${workOrders.length}`)

        const approvedWOs = workOrders.filter(wo => wo.status === 'approved')
        console.log(`Approved work orders: ${approvedWOs.length}`)

        const project5WOs = workOrders.filter(wo => wo.project_id === 5)
        console.log(`Work orders for project_id=5: ${project5WOs.length}`)

        const approvedProject5 = workOrders.filter(wo => wo.status === 'approved' && wo.project_id === 5)
        console.log(`Approved work orders for project_id=5: ${approvedProject5.length}`)

        process.exit(0)
    } catch (error) {
        console.error('Error:', error)
        process.exit(1)
    }
}

checkWorkOrders()
