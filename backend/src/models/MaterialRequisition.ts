import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface MaterialRequisitionAttributes {
  id: number
  requisition_number: string
  project_id: number
  from_warehouse_id: number
  requested_by: number
  requested_date: Date
  required_date?: Date
  status: 'pending' | 'approved' | 'partially_issued' | 'issued' | 'rejected'
  approved_by?: number
  created_at?: Date
}

interface MaterialRequisitionCreationAttributes extends Optional<MaterialRequisitionAttributes, 'id' | 'created_at'> {}

class MaterialRequisition extends Model<MaterialRequisitionAttributes, MaterialRequisitionCreationAttributes> implements MaterialRequisitionAttributes {
  public id!: number
  public requisition_number!: string
  public project_id!: number
  public from_warehouse_id!: number
  public requested_by!: number
  public requested_date!: Date
  public required_date?: Date
  public status!: MaterialRequisitionAttributes['status']
  public approved_by?: number
  public readonly created_at!: Date
}

MaterialRequisition.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    requisition_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    from_warehouse_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'warehouses',
        key: 'id',
      },
    },
    requested_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    requested_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    required_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'partially_issued', 'issued', 'rejected'),
      defaultValue: 'pending',
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
    tableName: 'material_requisitions',
    timestamps: false,
  }
)

export default MaterialRequisition
