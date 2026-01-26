import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface WarehouseAttributes {
  id: number
  name: string
  code: string
  type: 'central' | 'site' | 'regional' | 'fabrication'
  address?: string
  company_id?: number
  is_common: boolean
  warehouse_manager_id?: number
  project_id?: number
  building_id?: number
  floor_id?: number
  city?: string
  state?: string
  state_code?: string
  pincode?: string
  gstin?: string
  incharge_name?: string
  incharge_phone?: string
  created_at?: Date
}

interface WarehouseCreationAttributes extends Optional<WarehouseAttributes, 'id' | 'created_at'> { }

class Warehouse extends Model<WarehouseAttributes, WarehouseCreationAttributes> implements WarehouseAttributes {
  public id!: number
  public name!: string
  public code!: string
  public type!: 'central' | 'site' | 'regional' | 'fabrication'
  public address?: string
  public company_id?: number
  public is_common!: boolean
  public warehouse_manager_id?: number
  public project_id?: number
  public building_id?: number
  public floor_id?: number
  public city?: string
  public state?: string
  public state_code?: string
  public pincode?: string
  public incharge_name?: string
  public incharge_phone?: string
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
    type: {
      type: DataTypes.ENUM('central', 'site', 'regional', 'fabrication'),
      defaultValue: 'central',
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
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    building_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'project_buildings',
        key: 'id',
      },
    },
    floor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'project_floors',
        key: 'id',
      },
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state_code: {
      type: DataTypes.STRING(2),
      allowNull: true,
    },
    pincode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    gstin: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    incharge_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    incharge_phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
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

