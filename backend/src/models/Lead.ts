import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface LeadAttributes {
  id: number
  project_id?: number | null
  name: string
  company_name?: string
  phone?: string
  email?: string
  address?: string
  source?: string
  enquiry_date?: Date
  soil_report_url?: string
  layout_url?: string
  section_url?: string
  remarks?: string
  status: 'new' | 'quoted' | 'follow_up' | 'converted' | 'lost'
  created_at?: Date
}

interface LeadCreationAttributes extends Optional<LeadAttributes, 'id' | 'created_at'> { }

class Lead extends Model<LeadAttributes, LeadCreationAttributes> implements LeadAttributes {
  public id!: number
  public project_id?: number | null
  public name!: string
  public company_name?: string
  public phone?: string
  public email?: string
  public address?: string
  public source?: string
  public enquiry_date?: Date
  public soil_report_url?: string
  public layout_url?: string
  public section_url?: string
  public remarks?: string
  public status!: LeadAttributes['status']
  public readonly created_at!: Date
  public readonly project?: any
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
      allowNull: true,
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true, // Allow null temporarily to avoid breaking existing rows if any, or strictly enforce if desired. User payload has it. Let's say false/required if strict, but migration added as nullable. Let's keep nullable in strict sense but logic will enforce. Actually, better make it look required in Model if logic requires it.
    },
    company_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    remarks: {
      type: DataTypes.TEXT,
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

