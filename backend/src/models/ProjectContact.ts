import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

type ContactType =
  | 'site_engineer'
  | 'project_manager'
  | 'supervisor'
  | 'safety_officer'
  | 'surveyor'
  | 'labour_contractor'
  | 'client_contact'
  | 'decision_maker'
  | 'accounts'

interface ProjectContactAttributes {
  id: number
  project_id: number
  contact_type: ContactType
  name: string
  phone?: string
  email?: string
  designation?: string
  // Labour contractor specific
  company_name?: string
  labour_count?: number
  helper_count?: number
  operator_count?: number
  // Internal user link (for site staff assigned from user base)
  user_id?: number
  notes?: string
}

interface ProjectContactCreationAttributes extends Optional<ProjectContactAttributes, 'id'> { }

class ProjectContact extends Model<ProjectContactAttributes, ProjectContactCreationAttributes> implements ProjectContactAttributes {
  public id!: number
  public project_id!: number
  public contact_type!: ContactType
  public name!: string
  public phone?: string
  public email?: string
  public designation?: string
  public company_name?: string
  public labour_count?: number
  public helper_count?: number
  public operator_count?: number
  public user_id?: number
  public notes?: string
}

ProjectContact.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'projects', key: 'id' },
    },
    contact_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    designation: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    company_name: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    labour_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    helper_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    operator_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'project_contacts',
    timestamps: false,
  }
)

export default ProjectContact
