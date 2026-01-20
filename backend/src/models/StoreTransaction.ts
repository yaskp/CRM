import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface StoreTransactionAttributes {
  id: number
  transaction_number: string
  transaction_type: 'GRN' | 'STN' | 'SRN' | 'CONSUMPTION'

  source_type?: 'warehouse' | 'project' | 'vendor'
  destination_type?: 'warehouse' | 'project' | 'vendor'

  warehouse_id?: number // Now nullable (represents Source Warehouse)
  to_warehouse_id?: number // Nullable (represents Dest Warehouse)

  // Specific Project References
  from_project_id?: number
  to_project_id?: number // Distinct from project_id for clarity in transfers? Or reuse?

  // Vendor Return fields
  vendor_id?: number
  purchase_order_id?: number

  project_id?: number // Legacy/Generic project ref

  transaction_date: Date
  status: 'draft' | 'approved' | 'rejected'
  remarks?: string
  created_by: number
  approved_by?: number
  created_at?: Date
}

interface StoreTransactionCreationAttributes extends Optional<StoreTransactionAttributes, 'id' | 'created_at'> { }

class StoreTransaction extends Model<StoreTransactionAttributes, StoreTransactionCreationAttributes> implements StoreTransactionAttributes {
  public id!: number
  public transaction_number!: string
  public transaction_type!: StoreTransactionAttributes['transaction_type']

  public source_type?: 'warehouse' | 'project' | 'vendor'
  public destination_type?: 'warehouse' | 'project' | 'vendor'

  public warehouse_id?: number
  public to_warehouse_id?: number

  public from_project_id?: number
  public to_project_id?: number
  public vendor_id?: number
  public purchase_order_id?: number
  public project_id?: number

  public transaction_date!: Date
  public status!: StoreTransactionAttributes['status']
  public remarks?: string
  public created_by!: number
  public approved_by?: number
  public readonly created_at!: Date
}

StoreTransaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    transaction_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    transaction_type: {
      type: DataTypes.ENUM('GRN', 'STN', 'SRN', 'CONSUMPTION'),
      allowNull: false,
    },
    source_type: {
      type: DataTypes.ENUM('warehouse', 'project', 'vendor'),
      defaultValue: 'warehouse',
      allowNull: true
    },
    destination_type: {
      type: DataTypes.ENUM('warehouse', 'project', 'vendor'),
      defaultValue: 'warehouse',
      allowNull: true
    },
    warehouse_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Changed from false
      references: {
        model: 'warehouses',
        key: 'id',
      },
    },
    to_warehouse_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'warehouses',
        key: 'id',
      },
    },
    from_project_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    to_project_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'vendors',
        key: 'id',
      },
    },
    purchase_order_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'purchase_orders',
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
    transaction_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('draft', 'approved', 'rejected'),
      defaultValue: 'draft',
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    approved_by: {
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
    tableName: 'store_transactions',
    timestamps: false,
  }
)

export default StoreTransaction

