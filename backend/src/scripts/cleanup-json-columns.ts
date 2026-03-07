/**
 * cleanup-json-columns.ts
 *
 * Dev cleanup: drops legacy JSON blob columns from store_transactions.
 * All data from these columns has been dual-written to normalized tables:
 *   manpower_data      → dpr_manpower_logs
 *   machinery_data     → dpr_machinery_breakdown_logs
 *   pile_work_logs     → dpr_pile_work_logs
 *   panel_work_logs    → dpr_panel_work_logs
 *
 * Safe to run in development. DO NOT run on production before verifying all
 * normalized tables are fully populated.
 */

import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../../.env') })

import { sequelize } from '../database/connection'

const cleanup = async () => {
    await sequelize.authenticate()
    console.log('✅ Connected to DB.\n')

    const qi = sequelize.getQueryInterface()
    const tableDesc = await qi.describeTable('store_transactions')

    const columnsToRemove = [
        { col: 'manpower_data', reason: '→ dpr_manpower_logs' },
        { col: 'machinery_data', reason: '→ dpr_machinery_breakdown_logs' },
        { col: 'pile_work_logs', reason: '→ dpr_pile_work_logs' },
        { col: 'panel_work_logs', reason: '→ dpr_panel_work_logs' },
    ]

    for (const { col, reason } of columnsToRemove) {
        if (tableDesc[col]) {
            await qi.removeColumn('store_transactions', col)
            console.log(`✅ Dropped column: store_transactions.${col}  (${reason})`)
        } else {
            console.log(`⏭  Column already gone: store_transactions.${col}`)
        }
    }

    console.log('\n🎉 Legacy JSON column cleanup complete!')
    await sequelize.close()
    process.exit(0)
}

cleanup().catch(err => {
    console.error('❌ Cleanup failed:', err)
    process.exit(1)
})
