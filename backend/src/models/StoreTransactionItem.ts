import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface StoreTransactionItemAttributes {
  id: number
  transaction_id: number
  material_id: number
  quantity: number
  unit_price?: number
  batch_number?: string
  expiry_date?: Date
  created_at?: Date
}

interface StoreTransactionItemCreationAttributes extends Optional<StoreTransactionItemAttributes, 'id' | 'created_at'> {}

class StoreTransactionItem extends Model<StoreTransactionItemAttributes, StoreTransactionItemCreationAttributes> implements StoreTransactionItemAttributes {
  public id!: number
  public transaction_id!: number
  public material_id!: number
  public quantity!: number
  public unit_price?: number
  public batch_number?: string
  public expiry_date?: Date
  public readonly created_at!: Date
}

StoreTransactionItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    transaction_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'store_transactions',
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
    },
    unit_price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    batch_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    expiry_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'store_transaction_items',
    timestamps: false,
  }
)

export default StoreTransactionItem

