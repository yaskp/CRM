import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

/**
 * DPRPanelWorkLog — Normalized table for D-Wall panel execution entries per DPR.
 * One row per panel per DPR submission.
 * FK: transaction_id → store_transactions.id
 *
 * Indexed for:
 *  - project_id + report_date  → daily/monthly project reports
 *  - drawing_panel_id          → panel-wise progress & concrete tracking
 *  - concrete_grade            → grade-wise analytics
 *  - created_at                → time-series queries
 */

interface DPRPanelWorkLogAttributes {
    id: number
    transaction_id: number          // FK → store_transactions.id (the DPR header)
    project_id: number              // Denormalized for fast reporting without joins
    report_date: Date               // Denormalized from transaction_date for fast reporting
    drawing_panel_id?: number       // FK → drawing_panels.id
    panel_identifier?: string       // Denormalized label (e.g. "P-101") for display

    // Grabbing Phase
    grabbing_depth?: number         // metres (DECIMAL 10,3)
    grabbing_sqm?: number           // m² (DECIMAL 10,3)
    grabbing_start_time?: string    // HH:mm
    grabbing_end_time?: string      // HH:mm

    // Concreting Phase
    concrete_start_time?: string    // HH:mm
    concrete_end_time?: string      // HH:mm
    concrete_grade?: string         // M20, M25, M30 ...
    theoretical_concrete_qty?: number  // m³ auto-calculated (DECIMAL 10,3)
    actual_concrete_qty?: number       // m³ entered by site engineer (DECIMAL 10,3)

    // Reference
    cage_id_ref?: string
    work_order_id?: number  // → work_orders (contractor billing linkage)
    boq_item_id?: number    // → project_boq_items (cost vs budget per panel)

    created_at?: Date
}

interface DPRPanelWorkLogCreationAttributes
    extends Optional<DPRPanelWorkLogAttributes, 'id' | 'created_at'> { }

class DPRPanelWorkLog
    extends Model<DPRPanelWorkLogAttributes, DPRPanelWorkLogCreationAttributes>
    implements DPRPanelWorkLogAttributes {
    public id!: number
    public transaction_id!: number
    public project_id!: number
    public report_date!: Date
    public drawing_panel_id?: number
    public panel_identifier?: string
    public grabbing_depth?: number
    public grabbing_sqm?: number
    public grabbing_start_time?: string
    public grabbing_end_time?: string
    public concrete_start_time?: string
    public concrete_end_time?: string
    public concrete_grade?: string
    public theoretical_concrete_qty?: number
    public actual_concrete_qty?: number
    public cage_id_ref?: string
    public work_order_id?: number
    public boq_item_id?: number
    public readonly created_at!: Date
}

DPRPanelWorkLog.init(
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
        drawing_panel_id: {
            type: DataTypes.INTEGER, allowNull: true,
            references: { model: 'drawing_panels', key: 'id' }
        },
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
        work_order_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'work_orders', key: 'id' } },
        boq_item_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'project_boq_items', key: 'id' } },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
        sequelize,
        tableName: 'dpr_panel_work_logs',
        timestamps: false,
        indexes: [
            { fields: ['transaction_id'], name: 'idx_dpanellog_transaction' },
            { fields: ['project_id', 'report_date'], name: 'idx_dpanellog_project_date' },
            { fields: ['drawing_panel_id'], name: 'idx_dpanellog_panel' },
            { fields: ['concrete_grade'], name: 'idx_dpanellog_grade' },
            { fields: ['report_date'], name: 'idx_dpanellog_date' },
        ],
    }
)

export default DPRPanelWorkLog
