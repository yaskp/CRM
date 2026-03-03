import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

/**
 * DPRManpowerLog — Normalized table for manpower (staff + labour) entries per DPR.
 * One row per worker-type per DPR submission.
 * FK: transaction_id → store_transactions.id
 *
 * Indexed for:
 *  - project_id + report_date  → daily labour cost reporting
 *  - worker_type               → category-wise headcount analytics
 *  - user_id                   → staff attendance / utilization reports
 */

interface DPRManpowerLogAttributes {
    id: number
    transaction_id: number          // FK → store_transactions.id
    project_id: number              // Denormalized for fast reporting
    report_date: Date               // Denormalized for fast reporting

    // Worker details
    worker_type?: string            // e.g. "Mason", "Helper", "Crane Operator"
    user_id?: number                // FK → users.id (for internal staff)
    staff_name?: string             // Name (for external / labour)
    staff_role?: string             // Role label

    count: number                   // Number of workers of this type (INTEGER)
    hajri: number                   // Attendance fraction: 0.5 = half day, 1 = full day (DECIMAL 3,1)
    is_staff: boolean               // true = internal staff, false = contract labour

    created_at?: Date
}

interface DPRManpowerLogCreationAttributes
    extends Optional<DPRManpowerLogAttributes, 'id' | 'created_at'> { }

class DPRManpowerLog
    extends Model<DPRManpowerLogAttributes, DPRManpowerLogCreationAttributes>
    implements DPRManpowerLogAttributes {
    public id!: number
    public transaction_id!: number
    public project_id!: number
    public report_date!: Date
    public worker_type?: string
    public user_id?: number
    public staff_name?: string
    public staff_role?: string
    public count!: number
    public hajri!: number
    public is_staff!: boolean
    public readonly created_at!: Date
}

DPRManpowerLog.init(
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
        worker_type: { type: DataTypes.STRING(100), allowNull: true },
        user_id: {
            type: DataTypes.INTEGER, allowNull: true,
            references: { model: 'users', key: 'id' }
        },
        staff_name: { type: DataTypes.STRING(150), allowNull: true },
        staff_role: { type: DataTypes.STRING(100), allowNull: true },
        count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        hajri: { type: DataTypes.DECIMAL(3, 1), allowNull: false, defaultValue: 1 },
        is_staff: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
        sequelize,
        tableName: 'dpr_manpower_logs',
        timestamps: false,
        indexes: [
            { fields: ['transaction_id'], name: 'idx_dmanpower_transaction' },
            { fields: ['project_id', 'report_date'], name: 'idx_dmanpower_project_date' },
            { fields: ['worker_type'], name: 'idx_dmanpower_worker_type' },
            { fields: ['user_id'], name: 'idx_dmanpower_user' },
            { fields: ['is_staff'], name: 'idx_dmanpower_is_staff' },
        ],
    }
)

export default DPRManpowerLog
