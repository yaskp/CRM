import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface LeadAttributes {
  id: number
  client_id?: number | null
  project_id?: number | null
  name: string
  company_name?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  state_code?: string
  source?: string
  enquiry_date?: Date
  soil_report_url?: string
  layout_url?: string
  section_url?: string
  remarks?: string
  status: 'new' | 'contacted' | 'quoted' | 'follow_up' | 'converted' | 'lost'
  created_at?: Date
}

interface LeadCreationAttributes extends Optional<LeadAttributes, 'id' | 'created_at'> { }

class Lead extends Model<LeadAttributes, LeadCreationAttributes> implements LeadAttributes {
  public id!: number
  public client_id?: number | null
  public project_id?: number | null
  public name!: string
  public company_name?: string
  public phone?: string
  public email?: string
  public address?: string
  public city?: string
  public state?: string
  public state_code?: string
  public source?: string
  public enquiry_date?: Date
  public soil_report_url?: string
  public layout_url?: string
  public section_url?: string
  public remarks?: string
  public status!: LeadAttributes['status']
  public readonly created_at!: Date
  public readonly project?: any
  public readonly client?: any
}

Lead.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'clients',
        key: 'id',
      },
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
      allowNull: true,
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
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state_code: {
      type: DataTypes.STRING(2),
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
      type: DataTypes.ENUM('new', 'contacted', 'quoted', 'follow_up', 'converted', 'lost'),
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
