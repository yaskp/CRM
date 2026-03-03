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
    console.log('✅ Connected to DB.\n')

    const qi = sequelize.getQueryInterface()

    // ── 1. dpr_panel_work_logs ──────────────────────────────────────────────────
    const panelTableExists = await qi.showAllTables().then(tables => tables.includes('dpr_panel_work_logs'))
    if (!panelTableExists) {
        await qi.createTable('dpr_panel_work_logs', {
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            transaction_id: { type: DataTypes.INTEGER, allowNull: false },
            project_id: { type: DataTypes.INTEGER, allowNull: false },
            report_date: { type: DataTypes.DATEONLY, allowNull: false },
            drawing_panel_id: { type: DataTypes.INTEGER, allowNull: true },
            panel_identifier: { type: DataTypes.STRING(50), allowNull: true },
            grabbing_depth: { type: DataTypes.DECIMAL(10, 3), allowNull: true },
            grabbing_sqm: { type: DataTypes.DECIMAL(10, 3), allowNull: true },
            grabbing_start_time: { type: DataTypes.STRING(10), allowNull: true },
            grabbing_end_time: { type: DataTypes.STRING(10), allowNull: true },
            concrete_start_time: { type: DataTypes.STRING(10), allowNull: true },
            concrete_end_time: { type: DataTypes.STRING(10), allowNull: true },
            concrete_grade: { type: DataTypes.STRING(20), allowNull: true },
            theoretical_concrete_qty: { type: DataTypes.DECIMAL(10, 3), allowNull: true },
            actual_concrete_qty: { type: DataTypes.DECIMAL(10, 3), allowNull: true },
            cage_id_ref: { type: DataTypes.STRING(100), allowNull: true },
            created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        })
        // Add indexes
        await sequelize.query('CREATE INDEX idx_dpanellog_transaction ON dpr_panel_work_logs (transaction_id)')
        await sequelize.query('CREATE INDEX idx_dpanellog_project_date ON dpr_panel_work_logs (project_id, report_date)')
        await sequelize.query('CREATE INDEX idx_dpanellog_panel ON dpr_panel_work_logs (drawing_panel_id)')
        await sequelize.query('CREATE INDEX idx_dpanellog_grade ON dpr_panel_work_logs (concrete_grade)')
        await sequelize.query('CREATE INDEX idx_dpanellog_date ON dpr_panel_work_logs (report_date)')
        console.log('✅ Created table: dpr_panel_work_logs')
    } else {
        console.log('⏭  Table already exists: dpr_panel_work_logs')
        // Ensure actual_concrete_qty exists (may have been added later)
        const desc = await qi.describeTable('dpr_panel_work_logs')
        if (!desc['actual_concrete_qty']) {
            await qi.addColumn('dpr_panel_work_logs', 'actual_concrete_qty', { type: DataTypes.DECIMAL(10, 3), allowNull: true })
            console.log('✅ Added column: actual_concrete_qty to existing dpr_panel_work_logs')
        }
    }

    // ── 2. dpr_pile_work_logs ───────────────────────────────────────────────────
    const pileTableExists = await qi.showAllTables().then(tables => tables.includes('dpr_pile_work_logs'))
    if (!pileTableExists) {
        await qi.createTable('dpr_pile_work_logs', {
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            transaction_id: { type: DataTypes.INTEGER, allowNull: false },
            project_id: { type: DataTypes.INTEGER, allowNull: false },
            report_date: { type: DataTypes.DATEONLY, allowNull: false },
            drawing_panel_id: { type: DataTypes.INTEGER, allowNull: true },
            pile_identifier: { type: DataTypes.STRING(50), allowNull: true },
            achieved_depth: { type: DataTypes.DECIMAL(10, 3), allowNull: true },
            rock_socket_length: { type: DataTypes.DECIMAL(10, 3), allowNull: true },
            start_time: { type: DataTypes.STRING(10), allowNull: true },
            end_time: { type: DataTypes.STRING(10), allowNull: true },
            concrete_poured: { type: DataTypes.DECIMAL(10, 3), allowNull: true },
            concrete_grade: { type: DataTypes.STRING(20), allowNull: true },
            steel_installed: { type: DataTypes.DECIMAL(10, 3), allowNull: true },
            rig_id: { type: DataTypes.INTEGER, allowNull: true },
            slump_test: { type: DataTypes.DECIMAL(6, 1), allowNull: true },
            cube_test_id: { type: DataTypes.STRING(50), allowNull: true },
            created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        })
        await sequelize.query('CREATE INDEX idx_dpilelog_transaction ON dpr_pile_work_logs (transaction_id)')
        await sequelize.query('CREATE INDEX idx_dpilelog_project_date ON dpr_pile_work_logs (project_id, report_date)')
        await sequelize.query('CREATE INDEX idx_dpilelog_pile ON dpr_pile_work_logs (drawing_panel_id)')
        await sequelize.query('CREATE INDEX idx_dpilelog_grade ON dpr_pile_work_logs (concrete_grade)')
        await sequelize.query('CREATE INDEX idx_dpilelog_date ON dpr_pile_work_logs (report_date)')
        console.log('✅ Created table: dpr_pile_work_logs')
    } else {
        console.log('⏭  Table already exists: dpr_pile_work_logs')
    }

    // ── 3. dpr_manpower_logs ────────────────────────────────────────────────────
    const manpowerTableExists = await qi.showAllTables().then(tables => tables.includes('dpr_manpower_logs'))
    if (!manpowerTableExists) {
        await qi.createTable('dpr_manpower_logs', {
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            transaction_id: { type: DataTypes.INTEGER, allowNull: false },
            project_id: { type: DataTypes.INTEGER, allowNull: false },
            report_date: { type: DataTypes.DATEONLY, allowNull: false },
            worker_type: { type: DataTypes.STRING(100), allowNull: true },
            user_id: { type: DataTypes.INTEGER, allowNull: true },
            staff_name: { type: DataTypes.STRING(150), allowNull: true },
            staff_role: { type: DataTypes.STRING(100), allowNull: true },
            count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            hajri: { type: DataTypes.DECIMAL(3, 1), allowNull: false, defaultValue: 1 },
            is_staff: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        })
        await sequelize.query('CREATE INDEX idx_dmanpower_transaction ON dpr_manpower_logs (transaction_id)')
        await sequelize.query('CREATE INDEX idx_dmanpower_project_date ON dpr_manpower_logs (project_id, report_date)')
        await sequelize.query('CREATE INDEX idx_dmanpower_worker_type ON dpr_manpower_logs (worker_type)')
        await sequelize.query('CREATE INDEX idx_dmanpower_user ON dpr_manpower_logs (user_id)')
        await sequelize.query('CREATE INDEX idx_dmanpower_is_staff ON dpr_manpower_logs (is_staff)')
        console.log('✅ Created table: dpr_manpower_logs')
    } else {
        console.log('⏭  Table already exists: dpr_manpower_logs')
    }

    console.log('\n🎉 DPR normalized tables migration complete!')
    await sequelize.close()
    process.exit(0)
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err)
    process.exit(1)
})
