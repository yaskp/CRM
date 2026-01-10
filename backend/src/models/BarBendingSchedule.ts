import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface BarBendingScheduleAttributes {
  id: number
  project_id: number
  panel_number?: string
  schedule_number?: string
  drawing_reference?: string
  steel_quantity_kg?: number
  status: 'draft' | 'approved' | 'in_progress' | 'completed'
  created_by: number
  created_at?: Date
}

interface BarBendingScheduleCreationAttributes extends Optional<BarBendingScheduleAttributes, 'id' | 'created_at'> {}

class BarBendingSchedule extends Model<BarBendingScheduleAttributes, BarBendingScheduleCreationAttributes> implements BarBendingScheduleAttributes {
  public id!: number
  public project_id!: number
  public panel_number?: string
  public schedule_number?: string
  public drawing_reference?: string
  public steel_quantity_kg?: number
  public status!: BarBendingScheduleAttributes['status']
  public created_by!: number
  public readonly created_at!: Date
}

BarBendingSchedule.init(
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
    panel_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    schedule_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    drawing_reference: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    steel_quantity_kg: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'approved', 'in_progress', 'completed'),
      defaultValue: 'draft',
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    tableName: 'bar_bending_schedules',
    timestamps: false,
  }
)

export default BarBendingSchedule

