import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface ProjectAttributes {
  id: number
  project_code: string
  name: string
  project_type?: 'residential' | 'commercial' | 'industrial' | 'infrastructure' | 'renovation' | 'other'
  location?: string
  city?: string
  state?: string
  site_pincode?: string
  client_ho_address?: string
  client_gstin?: string
  rera_number?: string
  start_date?: Date
  end_date?: Date
  contract_value?: number
  status: 'lead' | 'quotation' | 'confirmed' | 'design' | 'mobilization' | 'execution' | 'completed' | 'on_hold' | 'cancelled'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  created_by: number
  company_id?: number
  is_active?: boolean
  created_at?: Date
  updated_at?: Date
}

interface ProjectCreationAttributes extends Optional<ProjectAttributes, 'id' | 'created_at' | 'updated_at'> { }

class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
  public id!: number
  public project_code!: string
  public name!: string
  public project_type?: ProjectAttributes['project_type']
  public location?: string
  public city?: string
  public state?: string
  public site_pincode?: string
  public client_ho_address?: string
  public client_gstin?: string
  public rera_number?: string
  public start_date?: Date
  public end_date?: Date
  public contract_value?: number
  public status!: ProjectAttributes['status']
  public priority?: ProjectAttributes['priority']
  public created_by!: number
  public company_id?: number
  public is_active?: boolean
  public readonly created_at!: Date
  public readonly updated_at!: Date
}

Project.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    project_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    project_type: {
      type: DataTypes.ENUM('residential', 'commercial', 'industrial', 'infrastructure', 'renovation', 'other'),
      allowNull: true,
      defaultValue: 'residential',
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'site_location',
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'site_city',
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'site_state',
    },
    site_pincode: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    client_ho_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    client_gstin: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    rera_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    contract_value: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('lead', 'quotation', 'confirmed', 'design', 'mobilization', 'execution', 'completed', 'on_hold', 'cancelled'),
      defaultValue: 'lead',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium',
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'companies',
        key: 'id',
      },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    tableName: 'projects',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
)

export default Project

