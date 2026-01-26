import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface ProjectAttributes {
  id: number
  project_code: string
  name: string
  project_type?: 'residential' | 'commercial' | 'industrial' | 'infrastructure' | 'renovation' | 'other'

  // Normalized Redundant Client Fields
  client_name?: string
  client_contact_person?: string
  client_email?: string
  client_phone?: string
  client_address?: string
  client_gst_number?: string
  client_pan_number?: string

  // Site Details
  site_location?: string
  site_address?: string
  site_city?: string
  site_state?: string
  site_pincode?: string
  site_area?: number
  site_area_unit?: 'sqft' | 'sqm' | 'acre' | 'hectare'
  site_latitude?: string
  site_longitude?: string
  site_engineer_id?: number

  // Financial
  contract_value?: number
  budget_amount?: number
  payment_terms?: string
  advance_percentage?: number
  retention_percentage?: number

  // Timeline
  start_date?: Date
  expected_end_date?: Date
  actual_end_date?: Date
  duration_days?: number

  // Design
  architect_name?: string
  architect_contact?: string
  consultant_name?: string
  consultant_contact?: string
  total_floors?: number
  basement_floors?: number
  built_up_area?: number
  carpet_area?: number

  // Scope
  scope_of_work?: string
  specifications?: string
  special_requirements?: string

  // Legacy / Direct Access
  client_ho_address?: string
  client_gstin?: string
  site_state_code?: string
  rera_number?: string

  status: 'lead' | 'quotation' | 'confirmed' | 'design' | 'mobilization' | 'execution' | 'completed' | 'on_hold' | 'cancelled'
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  completion_percentage?: number

  contract_document_path?: string
  drawing_folder_path?: string
  boq_document_path?: string

  remarks?: string
  cancellation_reason?: string

  created_by: number
  company_id?: number
  client_id?: number
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

  public client_name?: string
  public client_contact_person?: string
  public client_email?: string
  public client_phone?: string
  public client_address?: string
  public client_gst_number?: string
  public client_pan_number?: string

  public site_location?: string
  public site_address?: string
  public site_city?: string
  public site_state?: string
  public site_pincode?: string
  public site_area?: number
  public site_area_unit?: ProjectAttributes['site_area_unit']
  public site_latitude?: string
  public site_longitude?: string
  public site_engineer_id?: number

  public contract_value?: number
  public budget_amount?: number
  public payment_terms?: string
  public advance_percentage?: number
  public retention_percentage?: number

  public start_date?: Date
  public expected_end_date?: Date
  public actual_end_date?: Date
  public duration_days?: number

  public architect_name?: string
  public architect_contact?: string
  public consultant_name?: string
  public consultant_contact?: string
  public total_floors?: number
  public basement_floors?: number
  public built_up_area?: number
  public carpet_area?: number

  public scope_of_work?: string
  public specifications?: string
  public special_requirements?: string

  public client_ho_address?: string
  public client_gstin?: string
  public site_state_code?: string
  public rera_number?: string

  public status!: ProjectAttributes['status']
  public priority?: ProjectAttributes['priority']
  public completion_percentage?: number

  public contract_document_path?: string
  public drawing_folder_path?: string
  public boq_document_path?: string

  public remarks?: string
  public cancellation_reason?: string

  public created_by!: number
  public company_id?: number
  public client_id?: number
  public is_active?: boolean

  // Associations
  public creator?: any
  public company?: any
  public client?: any
  public leads?: any[]
  public quotations?: any[]
  public documents?: any[]
  public buildings?: any[]

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
    client_name: {
      type: DataTypes.STRING(200),
      defaultValue: 'Unknown Client',
    },
    client_contact_person: DataTypes.STRING(100),
    client_email: DataTypes.STRING(100),
    client_phone: DataTypes.STRING(20),
    client_address: DataTypes.TEXT,
    client_gst_number: DataTypes.STRING(15),
    client_pan_number: DataTypes.STRING(10),

    site_location: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    site_address: DataTypes.TEXT,
    site_city: DataTypes.STRING(100),
    site_state: DataTypes.STRING(100),
    site_pincode: DataTypes.STRING(10),
    site_area: DataTypes.DECIMAL(10, 2),
    site_area_unit: {
      type: DataTypes.ENUM('sqft', 'sqm', 'acre', 'hectare'),
      defaultValue: 'sqft',
    },
    site_latitude: DataTypes.STRING(50),
    site_longitude: DataTypes.STRING(50),
    site_engineer_id: {
      type: DataTypes.INTEGER,
      references: { model: 'users', key: 'id' },
    },

    contract_value: DataTypes.DECIMAL(15, 2),
    budget_amount: DataTypes.DECIMAL(15, 2),
    payment_terms: DataTypes.TEXT,
    advance_percentage: DataTypes.DECIMAL(5, 2),
    retention_percentage: DataTypes.DECIMAL(5, 2),

    start_date: DataTypes.DATEONLY,
    expected_end_date: DataTypes.DATEONLY,
    actual_end_date: DataTypes.DATEONLY,
    duration_days: DataTypes.INTEGER,

    architect_name: DataTypes.STRING(200),
    architect_contact: DataTypes.STRING(100),
    consultant_name: DataTypes.STRING(200),
    consultant_contact: DataTypes.STRING(100),
    total_floors: DataTypes.INTEGER,
    basement_floors: { type: DataTypes.INTEGER, defaultValue: 0 },
    built_up_area: DataTypes.DECIMAL(10, 2),
    carpet_area: DataTypes.DECIMAL(10, 2),

    scope_of_work: DataTypes.TEXT,
    specifications: DataTypes.TEXT,
    special_requirements: DataTypes.TEXT,

    client_ho_address: DataTypes.TEXT,
    client_gstin: DataTypes.STRING(20),
    site_state_code: DataTypes.STRING(2),
    rera_number: DataTypes.STRING(50),

    status: {
      type: DataTypes.ENUM('lead', 'quotation', 'confirmed', 'design', 'mobilization', 'execution', 'completed', 'on_hold', 'cancelled'),
      defaultValue: 'lead',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      defaultValue: 'medium',
    },
    completion_percentage: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },

    contract_document_path: DataTypes.STRING(500),
    drawing_folder_path: DataTypes.STRING(500),
    boq_document_path: DataTypes.STRING(500),

    remarks: DataTypes.TEXT,
    cancellation_reason: DataTypes.TEXT,

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
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'clients',
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

