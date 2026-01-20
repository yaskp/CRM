import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface WorkOrderAttributes {
  id: number
  project_id: number
  vendor_id?: number | null
  work_order_number: string
  po_wo_document_url?: string
  total_amount: number
  discount_percentage?: number
  final_amount: number
  payment_terms?: string
  status: 'draft' | 'approved' | 'active' | 'completed'
  created_at?: Date
}

interface WorkOrderCreationAttributes extends Optional<WorkOrderAttributes, 'id' | 'created_at'> { }

class WorkOrder extends Model<WorkOrderAttributes, WorkOrderCreationAttributes> implements WorkOrderAttributes {
  public id!: number
  public project_id!: number
  public vendor_id?: number | null
  public work_order_number!: string
  public po_wo_document_url?: string
  public total_amount!: number
  public discount_percentage?: number
  public final_amount!: number
  public payment_terms?: string
  public status!: WorkOrderAttributes['status']
  public readonly created_at!: Date
}

WorkOrder.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    work_order_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    po_wo_document_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    total_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    discount_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    final_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    payment_terms: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'approved', 'active', 'completed'),
      defaultValue: 'draft',
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'work_orders',
    timestamps: false,
  }
)

export default WorkOrder

