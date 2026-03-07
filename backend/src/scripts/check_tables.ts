import { sequelize } from './src/database/connection'

async function checkTables() {
    const [results] = await sequelize.query('SHOW TABLES')
    console.log(JSON.stringify(results, null, 2))
    await sequelize.close()
}

checkTables()
