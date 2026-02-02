import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface StoreTransactionItemAttributes {
  id: number
  transaction_id: number
  material_id: number
  quantity: number
  ordered_quantity: number
  accepted_quantity: number
  rejected_quantity: number
  excess_quantity: number
  shortage_quantity: number
  po_item_id?: number
  variance_type: 'exact' | 'excess' | 'shortage' | 'defective'
  rejection_reason?: string
  unit_price?: number
  item_status?: string // e.g. 'Good', 'Defective-Accepted'
  wastage_quantity?: number
  work_item_type_id?: number
  batch_number?: string
  expiry_date?: Date
  unit?: string
  work_done_quantity?: number
  issued_quantity?: number
  returned_quantity?: number
  drawing_panel_id?: number
  created_at?: Date
}

interface StoreTransactionItemCreationAttributes extends Optional<StoreTransactionItemAttributes, 'id' | 'created_at'> { }

class StoreTransactionItem extends Model<StoreTransactionItemAttributes, StoreTransactionItemCreationAttributes> implements StoreTransactionItemAttributes {
  public id!: number
  public transaction_id!: number
  public material_id!: number
  public quantity!: number
  public ordered_quantity!: number
  public accepted_quantity!: number
  public rejected_quantity!: number
  public excess_quantity!: number
  public shortage_quantity!: number
  public po_item_id?: number
  public variance_type!: 'exact' | 'excess' | 'shortage' | 'defective'
  public rejection_reason?: string
  public unit_price?: number
  public item_status?: string
  public wastage_quantity?: number
  public work_item_type_id?: number
  public batch_number?: string
  public expiry_date?: Date
  public unit?: string
  public work_done_quantity?: number
  public issued_quantity?: number
  public returned_quantity?: number
  public drawing_panel_id?: number
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
    ordered_quantity: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    accepted_quantity: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    rejected_quantity: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    excess_quantity: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    shortage_quantity: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    po_item_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'purchase_order_items',
        key: 'id'
      }
    },
    variance_type: {
      type: DataTypes.ENUM('exact', 'excess', 'shortage', 'defective'),
      defaultValue: 'exact',
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    unit_price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    item_status: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'Good',
    },
    wastage_quantity: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    work_item_type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'work_item_types',
        key: 'id'
      }
    },
    batch_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    expiry_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    work_done_quantity: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    issued_quantity: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    returned_quantity: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    drawing_panel_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'drawing_panels',
        key: 'id'
      }
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

