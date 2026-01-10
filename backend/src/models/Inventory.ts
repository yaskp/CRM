import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface InventoryAttributes {
  id: number
  warehouse_id: number
  material_id: number
  quantity: number
  reserved_quantity: number
  min_stock_level?: number
  max_stock_level?: number
  last_updated?: Date
}

interface InventoryCreationAttributes extends Optional<InventoryAttributes, 'id' | 'last_updated'> {}

class Inventory extends Model<InventoryAttributes, InventoryCreationAttributes> implements InventoryAttributes {
  public id!: number
  public warehouse_id!: number
  public material_id!: number
  public quantity!: number
  public reserved_quantity!: number
  public min_stock_level?: number
  public max_stock_level?: number
  public readonly last_updated!: Date
}

Inventory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    warehouse_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'warehouses',
        key: 'id',
      },
    },
    material_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'materials',
        key: 'id',
      },
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    reserved_quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    min_stock_level: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    max_stock_level: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    last_updated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'inventory',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['warehouse_id', 'material_id'],
        name: 'unique_warehouse_material',
      },
    ],
  }
)

export default Inventory

