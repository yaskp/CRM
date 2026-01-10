import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface PanelProgressAttributes {
  id: number
  panel_id: number
  progress_date: Date
  progress_percentage?: number
  status: 'not_started' | 'in_progress' | 'completed'
  work_stage?: string
  remarks?: string
  updated_by: number
  created_at?: Date
  updated_at?: Date
}

interface PanelProgressCreationAttributes extends Optional<PanelProgressAttributes, 'id' | 'created_at' | 'updated_at'> {}

class PanelProgress extends Model<PanelProgressAttributes, PanelProgressCreationAttributes> implements PanelProgressAttributes {
  public id!: number
  public panel_id!: number
  public progress_date!: Date
  public progress_percentage?: number
  public status!: PanelProgressAttributes['status']
  public work_stage?: string
  public remarks?: string
  public updated_by!: number
  public readonly created_at!: Date
  public readonly updated_at!: Date
}

PanelProgress.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    panel_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'drawing_panels',
        key: 'id',
      },
    },
    progress_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    progress_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('not_started', 'in_progress', 'completed'),
      defaultValue: 'not_started',
    },
    work_stage: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    updated_by: {
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
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'panel_progress',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
)

export default PanelProgress

