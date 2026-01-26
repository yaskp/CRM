
import { sequelize } from './src/database/connection'

const checkAnnexureTypes = async () => {
    try {
        await sequelize.authenticate()
        const [results] = await sequelize.query('SELECT DISTINCT type FROM annexures')
        console.log('Distinct Types:', JSON.stringify(results, null, 2))
    } catch (err) {
        console.error(err)
    } finally {
        await sequelize.close()
    }
}

checkAnnexureTypes()
