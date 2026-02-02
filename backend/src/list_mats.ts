import { sequelize } from './database/connection'
import { QueryTypes } from 'sequelize'

async function debug() {
    try {
        const mats = await sequelize.query('SELECT name FROM materials', { type: QueryTypes.SELECT })
        console.log(JSON.stringify(mats, null, 2))
    } finally {
        await sequelize.close()
    }
}
debug()
