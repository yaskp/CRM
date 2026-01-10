import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface DailyProgressReportAttributes {
  id: number
  project_id: number
  report_date: Date
  site_location?: string
  panel_number?: string
  guide_wall_running_meter?: number
  steel_quantity_kg?: number
  concrete_quantity_cubic_meter?: number
  polymer_consumption_bags?: number
  diesel_consumption_liters?: number
  weather_conditions?: string
  remarks?: string
  created_by: number
  created_at?: Date
}

interface DailyProgressReportCreationAttributes extends Optional<DailyProgressReportAttributes, 'id' | 'created_at'> {}

class DailyProgressReport extends Model<DailyProgressReportAttributes, DailyProgressReportCreationAttributes> implements DailyProgressReportAttributes {
  public id!: number
  public project_id!: number
  public report_date!: Date
  public site_location?: string
  public panel_number?: string
  public guide_wall_running_meter?: number
  public steel_quantity_kg?: number
  public concrete_quantity_cubic_meter?: number
  public polymer_consumption_bags?: number
  public diesel_consumption_liters?: number
  public weather_conditions?: string
  public remarks?: string
  public created_by!: number
  public readonly created_at!: Date
}

DailyProgressReport.init(
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
    report_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    site_location: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    panel_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    guide_wall_running_meter: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    steel_quantity_kg: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    concrete_quantity_cubic_meter: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    polymer_consumption_bags: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    diesel_consumption_liters: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    weather_conditions: {
      type: DataTypes.STRING(100),
      allowNull: true,
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
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'daily_progress_reports',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['project_id', 'report_date', 'panel_number'],
        name: 'unique_project_date_panel',
      },
    ],
  }
)

export default DailyProgressReport

