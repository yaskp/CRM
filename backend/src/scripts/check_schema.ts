import { sequelize } from './src/database/connection'

async function checkSchema() {
    const [results] = await sequelize.query('DESCRIBE work_order_items')
    console.log(JSON.stringify(results, null, 2))
    await sequelize.close()
}

checkSchema()
