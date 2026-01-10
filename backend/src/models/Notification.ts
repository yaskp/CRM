import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface NotificationAttributes {
  id: number
  user_id: number
  type: string
  title: string
  message?: string
  related_entity_type?: string
  related_entity_id?: number
  is_read: boolean
  created_at?: Date
}

interface NotificationCreationAttributes extends Optional<NotificationAttributes, 'id' | 'created_at'> {}

class Notification extends Model<NotificationAttributes, NotificationCreationAttributes> implements NotificationAttributes {
  public id!: number
  public user_id!: number
  public type!: string
  public title!: string
  public message?: string
  public related_entity_type?: string
  public related_entity_id?: number
  public is_read!: boolean
  public readonly created_at!: Date
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    related_entity_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    related_entity_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    is_read: {
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
    tableName: 'notifications',
    timestamps: false,
  }
)

export default Notification

