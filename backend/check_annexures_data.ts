
import { sequelize } from './src/database/connection'
import { DataTypes } from 'sequelize'

const checkAnnexures = async () => {
    try {
        await sequelize.authenticate()
        const [results] = await sequelize.query('SELECT * FROM annexures')
        console.log('Annexures count:', results.length)
        console.log('Annexures data:', JSON.stringify(results, null, 2))
    } catch (err) {
        console.error(err)
    } finally {
        await sequelize.close()
    }
}

checkAnnexures()
