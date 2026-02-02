import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface DailyProgressReportAttributes {
  id: number
  project_id: number
  report_date: Date
  site_location?: string
  panel_number?: string
  building_id?: number
  floor_id?: number
  zone_id?: number
  drawing_panel_id?: number
  work_item_type_id?: number
  work_completion_percentage?: number
  guide_wall_running_meter?: number
  steel_quantity_kg?: number
  concrete_quantity_cubic_meter?: number
  polymer_consumption_bags?: number
  diesel_consumption_liters?: number

  // D-Wall Specific Technical Fields
  actual_depth?: number
  verticality_x?: number
  verticality_y?: number
  slurry_density?: number
  slurry_viscosity?: number
  slurry_sand_content?: number
  cage_id_ref?: string
  start_time?: string // HH:mm
  end_time?: string   // HH:mm
  slump_flow?: number
  tremie_pipe_count?: number
  theoretical_concrete_qty?: number
  overbreak_percentage?: number

  weather_conditions?: string
  remarks?: string
  created_by: number
  created_at?: Date
}

interface DailyProgressReportCreationAttributes extends Optional<DailyProgressReportAttributes, 'id' | 'created_at'> { }

class DailyProgressReport extends Model<DailyProgressReportAttributes, DailyProgressReportCreationAttributes> implements DailyProgressReportAttributes {
  public id!: number
  public project_id!: number
  public report_date!: Date
  public site_location?: string
  public panel_number?: string
  public building_id?: number
  public floor_id?: number
  public zone_id?: number
  public drawing_panel_id?: number
  public work_item_type_id?: number
  public work_completion_percentage?: number
  public guide_wall_running_meter?: number
  public steel_quantity_kg?: number
  public concrete_quantity_cubic_meter?: number
  public polymer_consumption_bags?: number
  public diesel_consumption_liters?: number

  // D-Wall Specific Technical Fields
  public actual_depth?: number
  public verticality_x?: number
  public verticality_y?: number
  public slurry_density?: number
  public slurry_viscosity?: number
  public slurry_sand_content?: number
  public cage_id_ref?: string
  public start_time?: string
  public end_time?: string
  public slump_flow?: number
  public tremie_pipe_count?: number
  public theoretical_concrete_qty?: number
  public overbreak_percentage?: number

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
    drawing_panel_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'drawing_panels',
        key: 'id',
      },
    },
    work_item_type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'work_item_types',
        key: 'id'
      }
    },
    work_completion_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
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
    actual_depth: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    verticality_x: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    verticality_y: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    slurry_density: {
      type: DataTypes.DECIMAL(5, 3),
      allowNull: true,
    },
    slurry_viscosity: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    slurry_sand_content: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    cage_id_ref: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    start_time: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    end_time: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    slump_flow: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    tremie_pipe_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    theoretical_concrete_qty: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    overbreak_percentage: {
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
