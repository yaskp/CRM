import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface MaterialRequisitionItemAttributes {
  id: number
  requisition_id: number
  material_id: number
  requested_quantity: number
  issued_quantity: number
  unit: string
  boq_item_id?: number
  building_id?: number
  floor_id?: number
  zone_id?: number
  created_at?: Date
}

interface MaterialRequisitionItemCreationAttributes extends Optional<MaterialRequisitionItemAttributes, 'id' | 'created_at'> { }

class MaterialRequisitionItem extends Model<MaterialRequisitionItemAttributes, MaterialRequisitionItemCreationAttributes> implements MaterialRequisitionItemAttributes {
  public id!: number
  public requisition_id!: number
  public material_id!: number
  public requested_quantity!: number
  public issued_quantity!: number
  public unit!: string
  public boq_item_id?: number
  public building_id?: number
  public floor_id?: number
  public zone_id?: number
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
    boq_item_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'project_boq_items',
        key: 'id',
      },
    },
    building_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'project_buildings',
        key: 'id',
      },
    },
    floor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'project_floors',
        key: 'id',
      },
    },
    zone_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'project_zones',
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
    tableName: 'material_requisition_items',
    timestamps: false,
  }
)

export default MaterialRequisitionItem
