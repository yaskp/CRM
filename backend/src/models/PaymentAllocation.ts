import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

export interface PaymentAllocationAttributes {
    id: number
    financial_transaction_id: number

    // Link to Liability
    purchase_order_id?: number
    work_order_id?: number
    expense_id?: number

    allocated_amount: number
    tds_allocated: number
    retention_allocated: number

    created_at?: Date
}

export interface PaymentAllocationCreationAttributes extends Optional<PaymentAllocationAttributes, 'id' | 'created_at'> { }

class PaymentAllocation extends Model<PaymentAllocationAttributes, PaymentAllocationCreationAttributes> implements PaymentAllocationAttributes {
    public id!: number
    public financial_transaction_id!: number

    public purchase_order_id?: number
    public work_order_id?: number
    public expense_id?: number

    public allocated_amount!: number
    public tds_allocated!: number
    public retention_allocated!: number

    public readonly created_at!: Date
}

PaymentAllocation.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        financial_transaction_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'financial_transactions', key: 'id' },
        },
        purchase_order_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'purchase_orders', key: 'id' },
        },
        work_order_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'work_orders', key: 'id' },
        },
        expense_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'expenses', key: 'id' },
        },
        allocated_amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        tds_allocated: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
        },
        retention_allocated: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'payment_allocations',
        timestamps: false,
        underscored: true,
    }
)

export default PaymentAllocation
