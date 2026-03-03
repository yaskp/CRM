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
    console.log('✅ Connected')
    const qi = sequelize.getQueryInterface()

    const desc = await qi.describeTable('work_item_types')

    if (!desc['parent_id']) {
        await qi.addColumn('work_item_types', 'parent_id', {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'work_item_types', key: 'id' }
        })
        console.log('✅ Added work_item_types.parent_id (self-referencing FK for Main Type → Sub Type hierarchy)')
    } else {
        console.log('⏭  work_item_types.parent_id already exists')
    }

    // Also add quote_type to quotation_items if table exists (for reference tagging)
    try {
        const qiDesc = await qi.describeTable('quotation_items')
        if (!qiDesc['is_reference_only']) {
            await qi.addColumn('quotation_items', 'is_reference_only', {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                comment: 'If true, this item is Material Estimate for Reference only and is NOT included in quotation total'
            })
            console.log('✅ Added quotation_items.is_reference_only')
        } else {
            console.log('⏭  quotation_items.is_reference_only already exists')
        }
    } catch (e: any) {
        console.log(`ℹ️  quotation_items not found or error: ${e.message}`)
    }

    console.log('\n🎉 Work item type hierarchy migration complete!')
    await sequelize.close()
    process.exit(0)
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err)
    process.exit(1)
})
