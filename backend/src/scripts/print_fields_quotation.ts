import { sequelize } from './src/database/connection'

async function printFields() {
    const [results]: any = await sequelize.query('SHOW COLUMNS FROM quotation_items')
    console.log('FIELDS:', results.map((r: any) => r.Field).join('|'))
    await sequelize.close()
}

printFields()
