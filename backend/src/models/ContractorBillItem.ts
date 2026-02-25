import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

export interface ContractorBillItemAttributes {
    id: number
    bill_id: number

    // Work Reference
    work_order_item_id?: number
    work_item_type_id?: number
    description: string

    // Quantities
    boq_quantity?: number
    work_order_quantity: number
    previous_billed_quantity: number
    dpr_actual_quantity?: number
    current_bill_quantity: number
    cumulative_billed: number
    balance_quantity?: number

    // Variance
    variance_positive?: number
    variance_negative?: number
    max_allowed_quantity?: number
    min_allowed_quantity?: number
    variance_percentage?: number
    variance_quantity?: number

    // Validation Flags
    within_variance: boolean
    exceeds_work_order: boolean
    exceeds_dpr_actual: boolean
    requires_approval: boolean

    // Rates & Amounts
    unit: string
    rate: number
    amount: number

    // Verification
    verified_quantity?: number
    verified_amount?: number
    approved_quantity?: number
    approved_amount?: number
    verification_remarks?: string
    approval_remarks?: string

    created_at?: Date
    updated_at?: Date
}

export interface ContractorBillItemCreationAttributes
    extends Optional<ContractorBillItemAttributes, 'id' | 'created_at' | 'updated_at'> { }

class ContractorBillItem extends Model<ContractorBillItemAttributes, ContractorBillItemCreationAttributes>
    implements ContractorBillItemAttributes {
    public id!: number
    public bill_id!: number

    public work_order_item_id?: number
    public work_item_type_id?: number
    public description!: string

    public boq_quantity?: number
    public work_order_quantity!: number
    public previous_billed_quantity!: number
    public dpr_actual_quantity?: number
    public current_bill_quantity!: number
    public cumulative_billed!: number
    public balance_quantity?: number

    public variance_positive?: number
    public variance_negative?: number
    public max_allowed_quantity?: number
    public min_allowed_quantity?: number
    public variance_percentage?: number
    public variance_quantity?: number

    public within_variance!: boolean
    public exceeds_work_order!: boolean
    public exceeds_dpr_actual!: boolean
    public requires_approval!: boolean

    public unit!: string
    public rate!: number
    public amount!: number

    public verified_quantity?: number
    public verified_amount?: number
    public approved_quantity?: number
    public approved_amount?: number
    public verification_remarks?: string
    public approval_remarks?: string

    public readonly created_at!: Date
    public readonly updated_at!: Date
}

ContractorBillItem.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        bill_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'contractor_bills',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        work_order_item_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'work_order_items',
                key: 'id',
            },
        },
        work_item_type_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'work_item_types',
                key: 'id',
            },
        },
        description: {
            type: DataTypes.STRING(500),
            allowNull: false,
        },
        boq_quantity: {
            type: DataTypes.DECIMAL(15, 3),
            allowNull: true,
        },
        work_order_quantity: {
            type: DataTypes.DECIMAL(15, 3),
            allowNull: false,
        },
        previous_billed_quantity: {
            type: DataTypes.DECIMAL(15, 3),
            defaultValue: 0,
        },
        dpr_actual_quantity: {
            type: DataTypes.DECIMAL(15, 3),
            allowNull: true,
        },
        current_bill_quantity: {
            type: DataTypes.DECIMAL(15, 3),
            allowNull: false,
        },
        cumulative_billed: {
            type: DataTypes.DECIMAL(15, 3),
            defaultValue: 0,
        },
        balance_quantity: {
            type: DataTypes.DECIMAL(15, 3),
            allowNull: true,
        },
        variance_positive: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
        },
        variance_negative: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
        },
        max_allowed_quantity: {
            type: DataTypes.DECIMAL(15, 3),
            allowNull: true,
        },
        min_allowed_quantity: {
            type: DataTypes.DECIMAL(15, 3),
            allowNull: true,
        },
        variance_percentage: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
        },
        variance_quantity: {
            type: DataTypes.DECIMAL(15, 3),
            allowNull: true,
        },
        within_variance: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        exceeds_work_order: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        exceeds_dpr_actual: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        requires_approval: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        unit: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        rate: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        verified_quantity: {
            type: DataTypes.DECIMAL(15, 3),
            allowNull: true,
        },
        verified_amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
        },
        approved_quantity: {
            type: DataTypes.DECIMAL(15, 3),
            allowNull: true,
        },
        approved_amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
        },
        verification_remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        approval_remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'contractor_bill_items',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
)

export default ContractorBillItem
