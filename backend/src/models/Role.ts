import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface RoleAttributes {
  id: number
  name: string
  description?: string
  is_system_role: boolean
  created_at?: Date
}

interface RoleCreationAttributes extends Optional<RoleAttributes, 'id' | 'created_at'> {}

class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  public id!: number
  public name!: string
  public description?: string
  public is_system_role!: boolean
  public readonly created_at!: Date
}

Role.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_system_role: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'roles',
    timestamps: false,
  }
)

export default Role

