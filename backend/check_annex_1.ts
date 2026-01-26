
import { sequelize } from './src/database/connection'

const checkAnnexureAgain = async () => {
    try {
        await sequelize.authenticate()
        const [results] = await sequelize.query('SELECT * FROM annexures WHERE id=1')
        console.log('Annexure 1:', JSON.stringify(results[0], null, 2))
    } catch (err) {
        console.error(err)
    } finally {
        await sequelize.close()
    }
}

checkAnnexureAgain()
