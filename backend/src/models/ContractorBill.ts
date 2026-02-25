import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

// Contractor Bill Attributes
export interface ContractorBillAttributes {
    id: number
    bill_number: string
    bill_date: Date

    // References
    project_id: number
    work_order_id: number
    vendor_id: number

    // Bill Period
    period_from?: Date
    period_to?: Date

    // Amounts
    gross_amount: number
    previous_bills_amount: number
    cumulative_amount: number

    // Deductions
    tds_percentage: number
    tds_amount: number
    retention_percentage: number
    retention_amount: number
    other_deductions: number
    deduction_remarks?: string

    // Net Amount
    net_amount: number

    // Status
    status: 'draft' | 'submitted' | 'verified' | 'approved' | 'rejected' | 'paid'

    // Workflow
    submitted_by?: number
    submitted_at?: Date
    verified_by?: number
    verified_at?: Date
    approved_by?: number
    approved_at?: Date
    rejected_by?: number
    rejected_at?: Date
    rejection_reason?: string

    // Payment
    payment_date?: Date
    payment_reference?: string
    payment_mode?: 'cash' | 'cheque' | 'neft' | 'rtgs' | 'upi' | 'other'

    // Remarks
    remarks?: string
    internal_notes?: string

    // Audit
    created_by?: number
    created_at?: Date
    updated_at?: Date
}

export interface ContractorBillCreationAttributes
    extends Optional<ContractorBillAttributes, 'id' | 'created_at' | 'updated_at'> { }

class ContractorBill extends Model<ContractorBillAttributes, ContractorBillCreationAttributes>
    implements ContractorBillAttributes {
    public id!: number
    public bill_number!: string
    public bill_date!: Date

    public project_id!: number
    public work_order_id!: number
    public vendor_id!: number

    public period_from?: Date
    public period_to?: Date

    public gross_amount!: number
    public previous_bills_amount!: number
    public cumulative_amount!: number

    public tds_percentage!: number
    public tds_amount!: number
    public retention_percentage!: number
    public retention_amount!: number
    public other_deductions!: number
    public deduction_remarks?: string

    public net_amount!: number

    public status!: 'draft' | 'submitted' | 'verified' | 'approved' | 'rejected' | 'paid'

    public submitted_by?: number
    public submitted_at?: Date
    public verified_by?: number
    public verified_at?: Date
    public approved_by?: number
    public approved_at?: Date
    public rejected_by?: number
    public rejected_at?: Date
    public rejection_reason?: string

    public payment_date?: Date
    public payment_reference?: string
    public payment_mode?: 'cash' | 'cheque' | 'neft' | 'rtgs' | 'upi' | 'other'

    public remarks?: string
    public internal_notes?: string

    public created_by?: number
    public readonly created_at!: Date
    public readonly updated_at!: Date
}

ContractorBill.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        bill_number: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },
        bill_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        project_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'projects',
                key: 'id',
            },
        },
        work_order_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'work_orders',
                key: 'id',
            },
        },
        vendor_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'vendors',
                key: 'id',
            },
        },
        period_from: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        period_to: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        gross_amount: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
        },
        previous_bills_amount: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
        },
        cumulative_amount: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
        },
        tds_percentage: {
            type: DataTypes.DECIMAL(5, 2),
            defaultValue: 2.00,
        },
        tds_amount: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
        },
        retention_percentage: {
            type: DataTypes.DECIMAL(5, 2),
            defaultValue: 10.00,
        },
        retention_amount: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
        },
        other_deductions: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
        },
        deduction_remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        net_amount: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
        },
        status: {
            type: DataTypes.ENUM('draft', 'submitted', 'verified', 'approved', 'rejected', 'paid'),
            defaultValue: 'draft',
        },
        submitted_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        submitted_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        verified_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        verified_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        approved_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        approved_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        rejected_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        rejected_at: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        rejection_reason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        payment_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        payment_reference: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        payment_mode: {
            type: DataTypes.ENUM('cash', 'cheque', 'neft', 'rtgs', 'upi', 'other'),
            allowNull: true,
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        internal_notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            },
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
        tableName: 'contractor_bills',
        timestamps: true,
        underscored: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
)

export default ContractorBill
