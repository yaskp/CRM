import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../database/connection'

class RolePermission extends Model {}

RolePermission.init(
  {
    role_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    permission_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
  },
  {
    sequelize,
    tableName: 'role_permissions',
    timestamps: false,
  }
)

export default RolePermission

