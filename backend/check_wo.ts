
import { sequelize } from './src/database/connection'
import WorkOrder from './src/models/WorkOrder'

// Ensure models are initialized (by importing index? No, usually not needed if explicit import)
// But associations might be missing if I don't import src/models/index.ts
import './src/models/index'

const checkWorkOrders = async () => {
    try {
        await sequelize.authenticate()
        console.log('Connection has been established successfully.')

        const count = await WorkOrder.count()
        console.log(`Total WorkOrders found: ${count}`)

        if (count > 0) {
            const orders = await WorkOrder.findAll({ limit: 5 })
            console.log('Sample orders:', JSON.stringify(orders, null, 2))
        } else {
            console.log('No work orders found in DB.')
        }
    } catch (error) {
        console.error('Unable to connect to the database:', error)
    } finally {
        await sequelize.close()
    }
}

checkWorkOrders()
