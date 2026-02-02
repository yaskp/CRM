import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

export interface FinancialTransactionAttributes {
    id: number
    transaction_number: string
    transaction_date: Date
    type: 'payment' | 'receipt' | 'contra' | 'journal'
    category: 'vendor' | 'client' | 'site_expense' | 'salary' | 'advance' | 'other'

    // Amounts
    amount: number
    tds_amount: number
    retention_amount: number
    net_amount: number

    // Linking
    project_id?: number
    vendor_id?: number
    client_id?: number
    user_id?: number // For advances to staff or salaries

    // Payment Details
    payment_mode: 'cash' | 'cheque' | 'neft' | 'rtgs' | 'upi'
    reference_number?: string // Cheque No / UTR No
    bank_name?: string
    bank_account_id?: number // Link to company bank accounts master

    status: 'draft' | 'pending' | 'cleared' | 'cancelled'
    remarks?: string
    attachment_url?: string

    created_by: number
    approved_by?: number
    created_at?: Date
    updated_at?: Date
}

export interface FinancialTransactionCreationAttributes extends Optional<FinancialTransactionAttributes, 'id' | 'status' | 'tds_amount' | 'retention_amount' | 'created_at' | 'updated_at'> { }

class FinancialTransaction extends Model<FinancialTransactionAttributes, FinancialTransactionCreationAttributes> implements FinancialTransactionAttributes {
    public id!: number
    public transaction_number!: string
    public transaction_date!: Date
    public type!: FinancialTransactionAttributes['type']
    public category!: FinancialTransactionAttributes['category']

    public amount!: number
    public tds_amount!: number
    public retention_amount!: number
    public net_amount!: number

    public project_id?: number
    public vendor_id?: number
    public client_id?: number
    public user_id?: number

    public payment_mode!: FinancialTransactionAttributes['payment_mode']
    public reference_number?: string
    public bank_name?: string
    public bank_account_id?: number

    public status!: FinancialTransactionAttributes['status']
    public remarks?: string
    public attachment_url?: string

    public created_by!: number
    public approved_by?: number
    public readonly created_at!: Date
    public readonly updated_at!: Date
}

FinancialTransaction.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        transaction_number: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },
        transaction_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM('payment', 'receipt', 'contra', 'journal'),
            allowNull: false,
        },
        category: {
            type: DataTypes.ENUM('vendor', 'client', 'site_expense', 'salary', 'advance', 'other'),
            allowNull: false,
        },
        amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        tds_amount: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
        },
        retention_amount: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
        },
        net_amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        project_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'projects', key: 'id' },
        },
        vendor_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'vendors', key: 'id' },
        },
        client_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'clients', key: 'id' },
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
        },
        payment_mode: {
            type: DataTypes.ENUM('cash', 'cheque', 'neft', 'rtgs', 'upi'),
            allowNull: false,
            defaultValue: 'neft',
        },
        reference_number: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        bank_name: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        bank_account_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('draft', 'pending', 'cleared', 'cancelled'),
            defaultValue: 'draft',
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        attachment_url: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
        },
        approved_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'users', key: 'id' },
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
        tableName: 'financial_transactions',
        timestamps: true,
        underscored: true,
    }
)

export default FinancialTransaction
