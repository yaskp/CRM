import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface ProjectContactAttributes {
  id: number
  project_id: number
  contact_type: 'site' | 'office' | 'decision_maker' | 'accounts'
  name: string
  phone?: string
  email?: string
  designation?: string
}

interface ProjectContactCreationAttributes extends Optional<ProjectContactAttributes, 'id'> {}

class ProjectContact extends Model<ProjectContactAttributes, ProjectContactCreationAttributes> implements ProjectContactAttributes {
  public id!: number
  public project_id!: number
  public contact_type!: ProjectContactAttributes['contact_type']
  public name!: string
  public phone?: string
  public email?: string
  public designation?: string
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
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    contact_type: {
      type: DataTypes.ENUM('site', 'office', 'decision_maker', 'accounts'),
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
  },
  {
    sequelize,
    tableName: 'project_contacts',
    timestamps: false,
  }
)

export default ProjectContact
