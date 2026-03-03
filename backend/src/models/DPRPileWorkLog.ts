import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

/**
 * DPRPileWorkLog — Normalized table for Pile execution entries per DPR.
 * One row per pile per DPR submission.
 * FK: transaction_id → store_transactions.id
 *
 * Indexed for:
 *  - project_id + report_date  → daily/monthly project reports
 *  - drawing_panel_id          → pile-wise progress & depth tracking
 *  - concrete_grade            → grade-wise analytics
 */

interface DPRPileWorkLogAttributes {
    id: number
    transaction_id: number          // FK → store_transactions.id (the DPR header)
    project_id: number              // Denormalized for fast reporting
    report_date: Date               // Denormalized for fast reporting
    drawing_panel_id?: number       // FK → drawing_panels.id (pile record)
    pile_identifier?: string        // Denormalized label (e.g. "P-101") for display

    // Drilling / Progress
    achieved_depth?: number         // metres drilled this session (DECIMAL 10,3)
    rock_socket_length?: number     // metres rock socket (DECIMAL 10,3)
    start_time?: string             // HH:mm
    end_time?: string               // HH:mm

    // Concreting
    concrete_poured?: number        // m³ theoretical (DECIMAL 10,3)
    actual_concrete_qty?: number    // m³ actual (DECIMAL 10,3)
    concrete_grade?: string         // M25, M30 ...

    // Steel
    steel_installed?: number        // kg (DECIMAL 10,3)

    // Quality
    rig_id?: number                 // FK → equipment.id (if applicable)
    slump_test?: number             // mm
    cube_test_id?: string           // Cube test reference number
    work_order_id?: number          // → work_orders (contractor billing linkage)
    boq_item_id?: number            // → project_boq_items (cost vs BOQ per pile)

    created_at?: Date
}

interface DPRPileWorkLogCreationAttributes
    extends Optional<DPRPileWorkLogAttributes, 'id' | 'created_at'> { }

class DPRPileWorkLog
    extends Model<DPRPileWorkLogAttributes, DPRPileWorkLogCreationAttributes>
    implements DPRPileWorkLogAttributes {
    public id!: number
    public transaction_id!: number
    public project_id!: number
    public report_date!: Date
    public drawing_panel_id?: number
    public pile_identifier?: string
    public achieved_depth?: number
    public rock_socket_length?: number
    public start_time?: string
    public end_time?: string
    public concrete_poured?: number
    public actual_concrete_qty?: number
    public concrete_grade?: string
    public steel_installed?: number
    public rig_id?: number
    public slump_test?: number
    public cube_test_id?: string
    public work_order_id?: number
    public boq_item_id?: number
    public readonly created_at!: Date
}

DPRPileWorkLog.init(
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
        pile_identifier: { type: DataTypes.STRING(50), allowNull: true },
        achieved_depth: { type: DataTypes.DECIMAL(10, 3), allowNull: true },
        rock_socket_length: { type: DataTypes.DECIMAL(10, 3), allowNull: true },
        start_time: { type: DataTypes.STRING(10), allowNull: true },
        end_time: { type: DataTypes.STRING(10), allowNull: true },
        concrete_poured: { type: DataTypes.DECIMAL(10, 3), allowNull: true },
        actual_concrete_qty: { type: DataTypes.DECIMAL(10, 3), allowNull: true },
        concrete_grade: { type: DataTypes.STRING(20), allowNull: true },
        steel_installed: { type: DataTypes.DECIMAL(10, 3), allowNull: true },
        rig_id: { type: DataTypes.INTEGER, allowNull: true },
        slump_test: { type: DataTypes.DECIMAL(6, 1), allowNull: true },
        cube_test_id: { type: DataTypes.STRING(50), allowNull: true },
        work_order_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'work_orders', key: 'id' } },
        boq_item_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'project_boq_items', key: 'id' } },
        created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    },
    {
        sequelize,
        tableName: 'dpr_pile_work_logs',
        timestamps: false,
        indexes: [
            { fields: ['transaction_id'], name: 'idx_dpilelog_transaction' },
            { fields: ['project_id', 'report_date'], name: 'idx_dpilelog_project_date' },
            { fields: ['drawing_panel_id'], name: 'idx_dpilelog_pile' },
            { fields: ['concrete_grade'], name: 'idx_dpilelog_grade' },
            { fields: ['report_date'], name: 'idx_dpilelog_date' },
        ],
    }
)

export default DPRPileWorkLog
