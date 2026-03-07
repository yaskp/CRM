import { sequelize } from './src/database/connection'

async function checkMigrations() {
    const [results] = await sequelize.query('SELECT name FROM executed_migrations ORDER BY executed_at DESC LIMIT 5')
    console.log(JSON.stringify(results, null, 2))
    await sequelize.close()
}

checkMigrations()
