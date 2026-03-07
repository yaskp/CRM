import Material from './src/models/Material'
import { sequelize } from './src/database/connection'
import { Op } from 'sequelize'

async function findCement() {
    const materials = await Material.findAll({
        where: {
            name: { [Op.like]: '%cement%' }
        }
    })
    console.log('FOUND:', JSON.stringify(materials, null, 2))
    await sequelize.close()
}

findCement()
