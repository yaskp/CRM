
import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface InventoryLedgerAttributes {
    id: number
    material_id: number
    warehouse_id: number

    transaction_type: 'GRN' | 'STN_IN' | 'STN_OUT' | 'CONSUMPTION' | 'SRN' | 'SRN_IN' | 'SRN_OUT' | 'ADJUSTMENT' | 'OPENING'
    transaction_id?: number // Link to StoreTransaction.id
    transaction_number?: string
    transaction_date: Date

    quantity_in: number
    quantity_out: number
    balance_quantity: number
    unit: string

    batch_number?: string
    expiry_date?: Date

    rate?: number
    value?: number

    project_id?: number
    building_id?: number
    floor_id?: number
    zone_id?: number
    work_item_type_id?: number
    wastage_quantity?: number

    remarks?: string
    created_at?: Date
}

interface InventoryLedgerCreationAttributes extends Optional<InventoryLedgerAttributes, 'id' | 'created_at'> { }

class InventoryLedger extends Model<InventoryLedgerAttributes, InventoryLedgerCreationAttributes> implements InventoryLedgerAttributes {
    public id!: number
    public material_id!: number
    public warehouse_id!: number
    public transaction_type!: InventoryLedgerAttributes['transaction_type']
    public transaction_id?: number
    public transaction_number?: string
    public transaction_date!: Date
    public quantity_in!: number
    public quantity_out!: number
    public balance_quantity!: number
    public unit!: string
    public batch_number?: string
    public expiry_date?: Date
    public rate?: number
    public value?: number
    public project_id?: number
    public building_id?: number
    public floor_id?: number
    public zone_id?: number
    public work_item_type_id?: number
    public wastage_quantity?: number
    public remarks?: string
    public readonly created_at!: Date
}

InventoryLedger.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        material_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'materials', key: 'id' }
        },
        warehouse_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'warehouses', key: 'id' }
        },
        transaction_type: {
            type: DataTypes.ENUM('GRN', 'STN_IN', 'STN_OUT', 'CONSUMPTION', 'SRN', 'SRN_IN', 'SRN_OUT', 'ADJUSTMENT', 'OPENING'),
            allowNull: false,
        },
        transaction_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        transaction_number: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        transaction_date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
        },
        quantity_in: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
        },
        quantity_out: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
        },
        balance_quantity: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        unit: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        batch_number: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        expiry_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        rate: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
        },
        value: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
        },
        project_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'projects', key: 'id' }
        },
        building_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'project_buildings', key: 'id' }
        },
        floor_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'project_floors', key: 'id' }
        },
        zone_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'project_zones', key: 'id' }
        },
        work_item_type_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: 'work_item_types', key: 'id' }
        },
        wastage_quantity: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        }
    },
    {
        sequelize,
        tableName: 'inventory_ledger',
        timestamps: false,
        underscored: true,
    }
)

export default InventoryLedger
