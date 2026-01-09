import { DataTypes, Model } from 'sequelize'
import { sequelize } from '../database/connection'

class UserRole extends Model {}

UserRole.init(
  {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    role_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    assigned_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'user_roles',
    timestamps: false,
  }
)

export default UserRole

