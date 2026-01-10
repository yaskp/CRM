import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface MaterialRequisitionItemAttributes {
  id: number
  requisition_id: number
  material_id: number
  requested_quantity: number
  issued_quantity: number
  unit: string
  created_at?: Date
}

interface MaterialRequisitionItemCreationAttributes extends Optional<MaterialRequisitionItemAttributes, 'id' | 'created_at'> {}

class MaterialRequisitionItem extends Model<MaterialRequisitionItemAttributes, MaterialRequisitionItemCreationAttributes> implements MaterialRequisitionItemAttributes {
  public id!: number
  public requisition_id!: number
  public material_id!: number
  public requested_quantity!: number
  public issued_quantity!: number
  public unit!: string
  public readonly created_at!: Date
}

MaterialRequisitionItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    requisition_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'material_requisitions',
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
    requested_quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    issued_quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'material_requisition_items',
    timestamps: false,
  }
)

export default MaterialRequisitionItem
