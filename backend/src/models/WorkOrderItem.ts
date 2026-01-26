import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface WorkOrderItemAttributes {
  id: number
  work_order_id: number
  work_item_type_id?: number
  item_type: string
  category?: 'labour' | 'material'
  description?: string
  quantity: number
  unit: string
  rate: number
  amount: number
  created_at?: Date
}

interface WorkOrderItemCreationAttributes extends Optional<WorkOrderItemAttributes, 'id' | 'created_at'> { }

class WorkOrderItem extends Model<WorkOrderItemAttributes, WorkOrderItemCreationAttributes> implements WorkOrderItemAttributes {
  public id!: number
  public work_order_id!: number
  public work_item_type_id?: number
  public item_type!: string
  public category?: 'labour' | 'material'
  public description?: string
  public quantity!: number
  public unit!: string
  public rate!: number
  public amount!: number
  public readonly created_at!: Date
}

WorkOrderItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    work_order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'work_orders',
        key: 'id',
      },
    },
    work_item_type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'work_item_types',
        key: 'id',
      },
    },
    item_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    category: {
      type: DataTypes.ENUM('labour', 'material'),
      defaultValue: 'labour',
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    rate: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'work_order_items',
    timestamps: false,
  }
)

export default WorkOrderItem
