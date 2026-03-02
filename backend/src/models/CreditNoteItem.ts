import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

export interface CreditNoteItemAttributes {
    id: number
    credit_note_id: number
    material_id: number
    quantity: number
    unit_price: number
    tax_percentage: number
    tax_amount: number
    total_amount: number
    unit?: string
    remarks?: string
}

export interface CreditNoteItemCreationAttributes extends Optional<CreditNoteItemAttributes, 'id'> { }

class CreditNoteItem extends Model<CreditNoteItemAttributes, CreditNoteItemCreationAttributes> implements CreditNoteItemAttributes {
    public id!: number
    public credit_note_id!: number
    public material_id!: number
    public quantity!: number
    public unit_price!: number
    public tax_percentage!: number
    public tax_amount!: number
    public total_amount!: number
    public unit?: string
    public remarks?: string
}

CreditNoteItem.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        credit_note_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'credit_notes', key: 'id' },
        },
        material_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'materials', key: 'id' },
        },
        quantity: {
            type: DataTypes.DECIMAL(15, 3),
            allowNull: false,
        },
        unit_price: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        tax_percentage: {
            type: DataTypes.DECIMAL(5, 2),
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
        unit: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    },
    {
        sequelize,
        tableName: 'credit_note_items',
        timestamps: true,
        underscored: true,
    }
)

export default CreditNoteItem
