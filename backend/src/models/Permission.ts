import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface PermissionAttributes {
  id: number
  name: string
  module: string
  action: string
  description?: string
}

interface PermissionCreationAttributes extends Optional<PermissionAttributes, 'id'> {}

class Permission extends Model<PermissionAttributes, PermissionCreationAttributes> implements PermissionAttributes {
  public id!: number
  public name!: string
  public module!: string
  public action!: string
  public description?: string
}

Permission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    module: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'permissions',
    timestamps: false,
  }
)

export default Permission

