import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface ProjectAttributes {
  id: number
  project_code: string
  name: string
  location?: string
  city?: string
  state?: string
  client_ho_address?: string
  status: 'lead' | 'quotation' | 'confirmed' | 'design' | 'mobilization' | 'execution' | 'completed' | 'on_hold'
  created_by: number
  company_id?: number
  created_at?: Date
  updated_at?: Date
}

interface ProjectCreationAttributes extends Optional<ProjectAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
  public id!: number
  public project_code!: string
  public name!: string
  public location?: string
  public city?: string
  public state?: string
  public client_ho_address?: string
  public status!: ProjectAttributes['status']
  public created_by!: number
  public company_id?: number
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
    location: {
      type: DataTypes.STRING(200),
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
    client_ho_address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('lead', 'quotation', 'confirmed', 'design', 'mobilization', 'execution', 'completed', 'on_hold'),
      defaultValue: 'lead',
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

