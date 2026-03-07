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

    const tableExists = await qi.showAllTables().then(tables => tables.includes('dpr_machinery_breakdown_logs'))

    if (!tableExists) {
        await qi.createTable('dpr_machinery_breakdown_logs', {
            id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
            transaction_id: { type: DataTypes.INTEGER, allowNull: false },
            project_id: { type: DataTypes.INTEGER, allowNull: false },
            report_date: { type: DataTypes.DATEONLY, allowNull: false },
            equipment_id: { type: DataTypes.INTEGER, allowNull: true },
            equipment_name: { type: DataTypes.STRING(255), allowNull: true },
            equipment_type: { type: DataTypes.STRING(100), allowNull: true },
            registration_number: { type: DataTypes.STRING(100), allowNull: true },
            breakdown_start: { type: DataTypes.STRING(10), allowNull: true },   // HH:mm
            breakdown_end: { type: DataTypes.STRING(10), allowNull: true },   // HH:mm
            breakdown_hours: { type: DataTypes.DECIMAL(5, 2), allowNull: true },   // KEY billing field
            breakdown_reason: { type: DataTypes.STRING(50), allowNull: true },
            breakdown_description: { type: DataTypes.TEXT, allowNull: true },
            action_taken: { type: DataTypes.TEXT, allowNull: true },
            status: { type: DataTypes.ENUM('pending', 'repaired', 'replaced'), allowNull: true, defaultValue: 'pending' },
            created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        })

        // Indexes for fast reporting / billing queries
        await sequelize.query('CREATE INDEX idx_dmachinery_transaction ON dpr_machinery_breakdown_logs (transaction_id)')
        await sequelize.query('CREATE INDEX idx_dmachinery_project_date ON dpr_machinery_breakdown_logs (project_id, report_date)')
        await sequelize.query('CREATE INDEX idx_dmachinery_equip_date ON dpr_machinery_breakdown_logs (equipment_id, report_date)')
        await sequelize.query('CREATE INDEX idx_dmachinery_reason ON dpr_machinery_breakdown_logs (breakdown_reason)')
        await sequelize.query('CREATE INDEX idx_dmachinery_status ON dpr_machinery_breakdown_logs (status)')

        console.log('✅ Created table: dpr_machinery_breakdown_logs')
        console.log('✅ Created indexes for billing/reporting queries')
    } else {
        console.log('⏭  Table already exists: dpr_machinery_breakdown_logs')
    }

    console.log('\n🎉 DPR Machinery Breakdown migration complete!')
    await sequelize.close()
    process.exit(0)
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err)
    process.exit(1)
})
