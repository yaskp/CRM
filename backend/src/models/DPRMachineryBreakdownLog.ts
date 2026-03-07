import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

/**
 * DPRMachineryBreakdownLog — Normalized table for machine breakdown entries per DPR.
 *
 * One row per breakdown event per DPR. Multiple breakdowns can be recorded for
 * the same machine on the same day.
 *
 * FK: transaction_id → store_transactions.id  (unified DPR form)
 *     equipment_id   → equipment.id           (equipment master)
 *     project_id     → projects.id            (denormalized for fast reporting)
 *
 * Indexed for:
 *   - project_id + report_date       → monthly breakdown reports per project
 *   - equipment_id + report_date     → equipment utilization / billing queries
 *   - breakdown_reason               → category-wise analysis
 *   - status                         → pending repairs dashboard
 */

interface DPRMachineryBreakdownLogAttributes {
    id: number
    transaction_id: number          // FK → store_transactions.id
    project_id: number              // Denormalized for fast reporting
    report_date: string             // DATEONLY - duplicated for fast range queries

    equipment_id?: number           // FK → equipment.id (nullable for manual entry)
    equipment_name?: string         // Cached name (for display without JOIN)
    equipment_type?: string         // Cached type for grouping
    registration_number?: string    // Cached reg. no

    breakdown_start?: string        // HH:mm
    breakdown_end?: string          // HH:mm
    breakdown_hours?: number        // Auto-calculated (DECIMAL 5,2) — KEY for billing

    breakdown_reason?: string       // Enum-like: mechanical|electrical|hydraulic|tyre_track|fuel|operator_absent|no_work|maintenance|client_hold|other
    breakdown_description?: string  // Free-text details
    action_taken?: string           // Free-text: what was done
    status?: string                 // pending | repaired | replaced

    created_at?: Date
}

interface DPRMachineryBreakdownLogCreationAttributes
    extends Optional<DPRMachineryBreakdownLogAttributes, 'id' | 'created_at'> { }

class DPRMachineryBreakdownLog
    extends Model<DPRMachineryBreakdownLogAttributes, DPRMachineryBreakdownLogCreationAttributes>
    implements DPRMachineryBreakdownLogAttributes {
    public id!: number
    public transaction_id!: number
    public project_id!: number
    public report_date!: string
    public equipment_id?: number
    public equipment_name?: string
    public equipment_type?: string
    public registration_number?: string
    public breakdown_start?: string
    public breakdown_end?: string
    public breakdown_hours?: number
    public breakdown_reason?: string
    public breakdown_description?: string
    public action_taken?: string
    public status?: string
    public readonly created_at!: Date
}

DPRMachineryBreakdownLog.init(
    {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        transaction_id: {
            type: DataTypes.INTEGER, allowNull: false,
            references: { model: 'store_transactions', key: 'id' }
        },
        project_id: {
            type: DataTypes.INTEGER, allowNull: false,
            references: { model: 'projects', key: 'id' }
        },
        report_date: { type: DataTypes.DATEONLY, allowNull: false },
        equipment_id: {
            type: DataTypes.INTEGER, allowNull: true,
            references: { model: 'equipment', key: 'id' }
        },
        equipment_name: { type: DataTypes.STRING(255), allowNull: true },
        equipment_type: { type: DataTypes.STRING(100), allowNull: true },
        registration_number: { type: DataTypes.STRING(100), allowNull: true },
        breakdown_start: { type: DataTypes.STRING(10), allowNull: true },  // HH:mm
        breakdown_end: { type: DataTypes.STRING(10), allowNull: true },  // HH:mm
        breakdown_hours: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
        breakdown_reason: { type: DataTypes.STRING(50), allowNull: true },
        breakdown_description: { type: DataTypes.TEXT, allowNull: true },
        action_taken: { type: DataTypes.TEXT, allowNull: true },
        status: {
            type: DataTypes.ENUM('pending', 'repaired', 'replaced'),
            allowNull: true,
            defaultValue: 'pending'
        },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
        sequelize,
        tableName: 'dpr_machinery_breakdown_logs',
        timestamps: false,
        indexes: [
            { fields: ['transaction_id'], name: 'idx_dmachinery_transaction' },
            { fields: ['project_id', 'report_date'], name: 'idx_dmachinery_project_date' },
            { fields: ['equipment_id', 'report_date'], name: 'idx_dmachinery_equip_date' },
            { fields: ['breakdown_reason'], name: 'idx_dmachinery_reason' },
            { fields: ['status'], name: 'idx_dmachinery_status' },
        ],
    }
)

export default DPRMachineryBreakdownLog
