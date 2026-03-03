/**
 * MIGRATION: ERP Full Linkage
 * 
 * Adds missing FK columns to enable:
 *  1. store_transactions → work_order_id (Contractor billing from DPR)
 *  2. store_transactions → quotation_id  (Client billing linkage)
 *  3. store_transaction_items → boq_item_id (Cost vs BOQ per line item)
 *  4. dpr_panel_work_logs → work_order_id, boq_item_id (P&L at panel level)
 *  5. dpr_pile_work_logs  → work_order_id, boq_item_id
 *  6. quotations → quote_type (with_material | labour_only)
 *  7. work_orders → quote_type, quotation_id (traceability: Quote → WO → DPR → Bill)
 */

import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '../../.env') })

import { sequelize } from '../database/connection'
import { DataTypes, QueryInterface } from 'sequelize'

const addColumnIfMissing = async (
    qi: QueryInterface,
    table: string,
    column: string,
    definition: object
) => {
    const desc = await qi.describeTable(table).catch(() => null)
    if (!desc) {
        console.log(`⚠️  Table ${table} does not exist — skipping ${column}`)
        return
    }
    if (!desc[column]) {
        await qi.addColumn(table, column, definition)
        console.log(`✅ Added ${table}.${column}`)
    } else {
        console.log(`⏭  ${table}.${column} already exists`)
    }
}

const addIndexIfMissing = async (sql: string, label: string) => {
    try {
        await sequelize.query(sql)
        console.log(`✅ Index: ${label}`)
    } catch (e: any) {
        if (e.message?.includes('Duplicate key name')) {
            console.log(`⏭  Index exists: ${label}`)
        } else {
            console.warn(`⚠️  Index ${label}: ${e.message}`)
        }
    }
}

const migrate = async () => {
    await sequelize.authenticate()
    console.log('✅ Connected to DB.\n')
    const qi = sequelize.getQueryInterface()

    console.log('\n── store_transactions ─────────────────────────────────────────────')

    // work_order_id → links DPR to Contractor Work Order (enables billing from DPR)
    await addColumnIfMissing(qi, 'store_transactions', 'work_order_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'work_orders', key: 'id' }
    })

    // quotation_id → links DPR/consumption to the Client Quotation (project billing)
    await addColumnIfMissing(qi, 'store_transactions', 'quotation_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'quotations', key: 'id' }
    })

    // boq_id → links DPR to the active Project BOQ (for cost vs budget)
    await addColumnIfMissing(qi, 'store_transactions', 'boq_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'project_boqs', key: 'id' }
    })

    console.log('\n── store_transaction_items ────────────────────────────────────────')

    // boq_item_id already exists in store_transaction_items from MaterialRequisition FK
    // but let's ensure it's connected for DPR consumption tracking too
    await addColumnIfMissing(qi, 'store_transaction_items', 'work_order_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'work_orders', key: 'id' }
    })

    console.log('\n── dpr_panel_work_logs ────────────────────────────────────────────')

    await addColumnIfMissing(qi, 'dpr_panel_work_logs', 'work_order_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'work_orders', key: 'id' }
    })

    await addColumnIfMissing(qi, 'dpr_panel_work_logs', 'boq_item_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'project_boq_items', key: 'id' }
    })

    console.log('\n── dpr_pile_work_logs ─────────────────────────────────────────────')

    await addColumnIfMissing(qi, 'dpr_pile_work_logs', 'work_order_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'work_orders', key: 'id' }
    })

    await addColumnIfMissing(qi, 'dpr_pile_work_logs', 'boq_item_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'project_boq_items', key: 'id' }
    })

    console.log('\n── dpr_manpower_logs ──────────────────────────────────────────────')

    await addColumnIfMissing(qi, 'dpr_manpower_logs', 'work_order_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'work_orders', key: 'id' }
    })

    console.log('\n── quotations ─────────────────────────────────────────────────────')

    // quote_type: 'with_material' | 'labour_only'
    // Used to generate correct Contractor Work Order type and billing method
    await addColumnIfMissing(qi, 'quotations', 'quote_type', {
        type: DataTypes.ENUM('with_material', 'labour_only'),
        allowNull: true,
        defaultValue: 'with_material'
    })

    // material_scope: to note what materials client supplies vs contractor
    await addColumnIfMissing(qi, 'quotations', 'material_scope', {
        type: DataTypes.ENUM('full_supply', 'client_supply', 'partial'),
        allowNull: true,
        defaultValue: 'full_supply'
    })

    console.log('\n── work_orders ────────────────────────────────────────────────────')

    // quote_type mirrored on WO for billing logic (labour_only = no material deduction)
    await addColumnIfMissing(qi, 'work_orders', 'quote_type', {
        type: DataTypes.ENUM('with_material', 'labour_only'),
        allowNull: true,
        defaultValue: 'with_material'
    })

    // quotation_id: trace which quote spawned this WO
    await addColumnIfMissing(qi, 'work_orders', 'quotation_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'quotations', key: 'id' }
    })

    // boq_id: which BOQ this work order is priced against
    await addColumnIfMissing(qi, 'work_orders', 'boq_id', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'project_boqs', key: 'id' }
    })

    // created_by for work_orders (was missing)
    await addColumnIfMissing(qi, 'work_orders', 'created_by', {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' }
    })

    console.log('\n── Indexes ────────────────────────────────────────────────────────')

    await addIndexIfMissing(
        'CREATE INDEX idx_strans_work_order ON store_transactions (work_order_id)',
        'store_transactions.work_order_id'
    )
    await addIndexIfMissing(
        'CREATE INDEX idx_strans_quotation ON store_transactions (quotation_id)',
        'store_transactions.quotation_id'
    )
    await addIndexIfMissing(
        'CREATE INDEX idx_strans_boq ON store_transactions (boq_id)',
        'store_transactions.boq_id'
    )
    await addIndexIfMissing(
        'CREATE INDEX idx_dpanel_work_order ON dpr_panel_work_logs (work_order_id)',
        'dpr_panel_work_logs.work_order_id'
    )
    await addIndexIfMissing(
        'CREATE INDEX idx_dpanel_boq_item ON dpr_panel_work_logs (boq_item_id)',
        'dpr_panel_work_logs.boq_item_id'
    )
    await addIndexIfMissing(
        'CREATE INDEX idx_dpile_work_order ON dpr_pile_work_logs (work_order_id)',
        'dpr_pile_work_logs.work_order_id'
    )
    await addIndexIfMissing(
        'CREATE INDEX idx_dpile_boq_item ON dpr_pile_work_logs (boq_item_id)',
        'dpr_pile_work_logs.boq_item_id'
    )
    await addIndexIfMissing(
        'CREATE INDEX idx_wo_quotation ON work_orders (quotation_id)',
        'work_orders.quotation_id'
    )
    await addIndexIfMissing(
        'CREATE INDEX idx_wo_boq ON work_orders (boq_id)',
        'work_orders.boq_id'
    )

    console.log('\n🎉 ERP Full Linkage migration complete!')
    await sequelize.close()
    process.exit(0)
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err)
    process.exit(1)
})
