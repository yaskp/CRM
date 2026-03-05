/**
 * Migration: Add quotation_id, client_scope, contractor_scope to work_orders if not present
 * Run: npx ts-node src/migrations/add_quotation_link_to_work_orders.ts
 */
import { sequelize } from '../database/connection'

const run = async () => {
    try {
        await sequelize.authenticate()
        console.log('✅ DB connected')

        const qi = sequelize.getQueryInterface()

        // Check existing columns
        const tableDesc = await sequelize.query(`DESCRIBE work_orders`) as any
        const existingCols = tableDesc[0].map((r: any) => r.Field)
        console.log('Existing columns:', existingCols.join(', '))

        const toAdd: { col: string; sql: string }[] = [
            {
                col: 'quotation_id',
                sql: 'ALTER TABLE work_orders ADD COLUMN quotation_id INT NULL REFERENCES quotations(id)'
            },
            {
                col: 'client_scope',
                sql: 'ALTER TABLE work_orders ADD COLUMN client_scope TEXT NULL'
            },
            {
                col: 'contractor_scope',
                sql: 'ALTER TABLE work_orders ADD COLUMN contractor_scope TEXT NULL'
            },
            {
                col: 'quote_type',
                sql: "ALTER TABLE work_orders ADD COLUMN quote_type ENUM('with_material','labour_only') NULL DEFAULT 'with_material'"
            },
            {
                col: 'boq_id',
                sql: 'ALTER TABLE work_orders ADD COLUMN boq_id INT NULL'
            },
            {
                col: 'created_by',
                sql: 'ALTER TABLE work_orders ADD COLUMN created_by INT NULL'
            }
        ]

        for (const { col, sql } of toAdd) {
            if (!existingCols.includes(col)) {
                await sequelize.query(sql)
                console.log(`✅ Added column: ${col}`)
            } else {
                console.log(`⏭  Skipped (already exists): ${col}`)
            }
        }

        console.log('\n✅ Migration complete!')
        process.exit(0)
    } catch (err: any) {
        console.error('❌ Migration failed:', err.message)
        process.exit(1)
    }
}

run()
