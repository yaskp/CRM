import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface QuotationItemAttributes {
    id: number
    quotation_id: number
    description: string
    quantity: number
    unit: string
    rate: number
    amount: number
    item_type: string
    work_item_type_id?: number
    reference_id?: number
    created_at?: Date
}

interface QuotationItemCreationAttributes extends Optional<QuotationItemAttributes, 'id' | 'created_at'> { }

class QuotationItem extends Model<QuotationItemAttributes, QuotationItemCreationAttributes> implements QuotationItemAttributes {
    public id!: number
    public quotation_id!: number
    public description!: string
    public quantity!: number
    public unit!: string
    public rate!: number
    public amount!: number
    public item_type!: string
    public work_item_type_id?: number
    public reference_id?: number
    public readonly created_at!: Date
}

QuotationItem.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        quotation_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'quotations',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        item_type: {
            type: DataTypes.STRING(50),
            allowNull: false,
            defaultValue: 'material',
        },
        work_item_type_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'work_item_types',
                key: 'id',
            },
        },
        reference_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        quantity: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        unit: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        rate: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0,
        },
        amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'quotation_items',
        timestamps: false,
    }
)

export default QuotationItem
