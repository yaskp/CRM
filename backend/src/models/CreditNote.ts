import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

export interface CreditNoteAttributes {
    id: number
    credit_note_number: string
    transaction_date: string
    srn_id: number
    vendor_id: number
    purchase_order_id?: number
    subtotal: number
    tax_amount: number
    total_amount: number
    gst_type: 'intra_state' | 'inter_state'
    status: 'draft' | 'approved' | 'cancelled'
    remarks?: string
    created_by: number
    approved_by?: number
    created_at?: Date
    updated_at?: Date
}

export interface CreditNoteCreationAttributes extends Optional<CreditNoteAttributes, 'id' | 'status' | 'created_at' | 'updated_at'> { }

class CreditNote extends Model<CreditNoteAttributes, CreditNoteCreationAttributes> implements CreditNoteAttributes {
    public id!: number
    public credit_note_number!: string
    public transaction_date!: string
    public srn_id!: number
    public vendor_id!: number
    public purchase_order_id?: number
    public subtotal!: number
    public tax_amount!: number
    public total_amount!: number
    public gst_type!: 'intra_state' | 'inter_state'
    public status!: 'draft' | 'approved' | 'cancelled'
    public remarks?: string
    public created_by!: number
    public approved_by?: number
    public readonly created_at!: Date
    public readonly updated_at!: Date
}

CreditNote.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        credit_note_number: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },
        transaction_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        srn_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'store_transactions', key: 'id' },
        },
        vendor_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'vendors', key: 'id' },
        },
        purchase_order_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'purchase_orders', key: 'id' },
        },
        subtotal: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
        },
        tax_amount: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
        },
        total_amount: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
        },
        gst_type: {
            type: DataTypes.ENUM('intra_state', 'inter_state'),
            defaultValue: 'intra_state',
        },
        status: {
            type: DataTypes.ENUM('draft', 'approved', 'cancelled'),
            defaultValue: 'draft',
        },
        remarks: {
            type: DataTypes.TEXT,
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
    },
    {
        sequelize,
        tableName: 'credit_notes',
        timestamps: true,
        underscored: true,
    }
)

export default CreditNote
