import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../../.env') })

import { sequelize } from '../database/connection'
import { DataTypes } from 'sequelize'

const migrate = async () => {
    try {
        await sequelize.authenticate()
        console.log('✅ Connected to DB.\n')

        const qi = sequelize.getQueryInterface()
        const tableDesc = await qi.describeTable('store_transaction_items')

        if (!tableDesc['remarks']) {
            await qi.addColumn('store_transaction_items', 'remarks', {
                type: DataTypes.TEXT,
                allowNull: true
            })
            console.log('✅ Added column: remarks to store_transaction_items')
        }

        if (!tableDesc['log_progress']) {
            await qi.addColumn('store_transaction_items', 'log_progress', {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true
            })
            console.log('✅ Added column: log_progress to store_transaction_items')
        }

        if (!tableDesc['quotation_item_id']) {
            await qi.addColumn('store_transaction_items', 'quotation_item_id', {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: 'quotation_items',
                    key: 'id'
                }
            })
            console.log('✅ Added column: quotation_item_id to store_transaction_items')
        }

        console.log('\n🎉 Migration complete!')
    } catch (error) {
        console.error('❌ Migration failed:', error)
    } finally {
        await sequelize.close()
        process.exit(0)
    }
}

migrate()
