import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface LeadAttributes {
  id: number
  project_id: number
  source?: string
  enquiry_date?: Date
  soil_report_url?: string
  layout_url?: string
  section_url?: string
  status: 'new' | 'quoted' | 'follow_up' | 'converted' | 'lost'
  created_at?: Date
}

interface LeadCreationAttributes extends Optional<LeadAttributes, 'id' | 'created_at'> {}

class Lead extends Model<LeadAttributes, LeadCreationAttributes> implements LeadAttributes {
  public id!: number
  public project_id!: number
  public source?: string
  public enquiry_date?: Date
  public soil_report_url?: string
  public layout_url?: string
  public section_url?: string
  public status!: LeadAttributes['status']
  public readonly created_at!: Date
}

Lead.init(
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
    source: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    enquiry_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    soil_report_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    layout_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    section_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('new', 'quoted', 'follow_up', 'converted', 'lost'),
      defaultValue: 'new',
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'leads',
    timestamps: false,
  }
)

export default Lead

