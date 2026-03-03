import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../../.env') })

import { sequelize } from '../database/connection'
import { DataTypes } from 'sequelize'

const migrate = async () => {
    await sequelize.authenticate()
    console.log('Connected to DB.')

    const qi = sequelize.getQueryInterface()

    // 1. Change contact_type from ENUM to VARCHAR(50)
    try {
        await sequelize.query(`ALTER TABLE project_contacts MODIFY COLUMN contact_type VARCHAR(50) NOT NULL`)
        console.log('✅ contact_type changed to VARCHAR(50)')
    } catch (e: any) {
        console.log('⏭  contact_type already VARCHAR or error:', e.message)
    }

    const tableDesc = await qi.describeTable('project_contacts')

    const addIfMissing = async (col: string, def: any) => {
        if (!tableDesc[col]) {
            await qi.addColumn('project_contacts', col, def)
            console.log(`✅ Added column: ${col}`)
        } else {
            console.log(`⏭  Column already exists: ${col}`)
        }
    }

    await addIfMissing('company_name', { type: DataTypes.STRING(150), allowNull: true })
    await addIfMissing('labour_count', { type: DataTypes.INTEGER, allowNull: true })
    await addIfMissing('helper_count', { type: DataTypes.INTEGER, allowNull: true })
    await addIfMissing('operator_count', { type: DataTypes.INTEGER, allowNull: true })
    await addIfMissing('user_id', { type: DataTypes.INTEGER, allowNull: true })
    await addIfMissing('notes', { type: DataTypes.TEXT, allowNull: true })

    console.log('\n✅ Migration complete!')
    await sequelize.close()
    process.exit(0)
}

migrate().catch(err => {
    console.error('Migration failed:', err)
    process.exit(1)
})
