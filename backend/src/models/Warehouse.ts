import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface WarehouseAttributes {
  id: number
  name: string
  code: string
  address?: string
  company_id?: number
  is_common: boolean
  warehouse_manager_id?: number
  created_at?: Date
}

interface WarehouseCreationAttributes extends Optional<WarehouseAttributes, 'id' | 'created_at'> {}

class Warehouse extends Model<WarehouseAttributes, WarehouseCreationAttributes> implements WarehouseAttributes {
  public id!: number
  public name!: string
  public code!: string
  public address?: string
  public company_id?: number
  public is_common!: boolean
  public warehouse_manager_id?: number
  public readonly created_at!: Date
}

Warehouse.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'companies',
        key: 'id',
      },
    },
    is_common: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    warehouse_manager_id: {
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
  },
  {
    sequelize,
    tableName: 'warehouses',
    timestamps: false,
  }
)

export default Warehouse

