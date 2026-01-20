import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface PurchaseOrderItemAttributes {
    id: number
    po_id: number
    material_id?: number // Optional if it's a service or ad-hoc item
    description: string
    quantity: number
    unit: string
    unit_price: number
    tax_percentage: number
    tax_amount: number
    total_amount: number
    created_at?: Date
    updated_at?: Date
}

interface PurchaseOrderItemCreationAttributes extends Optional<PurchaseOrderItemAttributes, 'id' | 'created_at' | 'updated_at'> { }

class PurchaseOrderItem extends Model<PurchaseOrderItemAttributes, PurchaseOrderItemCreationAttributes> implements PurchaseOrderItemAttributes {
    public id!: number
    public po_id!: number
    public material_id?: number
    public description!: string
    public quantity!: number
    public unit!: string
    public unit_price!: number
    public tax_percentage!: number
    public tax_amount!: number
    public total_amount!: number
    public readonly created_at!: Date
    public readonly updated_at!: Date
}

PurchaseOrderItem.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        po_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'purchase_orders',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        material_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'materials',
                key: 'id',
            },
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        quantity: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 1,
        },
        unit: {
            type: DataTypes.STRING(20),
            allowNull: false,
            defaultValue: 'units',
        },
        unit_price: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0,
        },
        tax_percentage: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: false,
            defaultValue: 0,
        },
        tax_amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0,
        },
        total_amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0,
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
        tableName: 'purchase_order_items',
        timestamps: true,
        underscored: true,
    }
)

export default PurchaseOrderItem
