import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface ProjectVendorAttributes {
  id: number
  project_id: number
  vendor_id: number
  vendor_type: 'steel_contractor' | 'concrete_contractor' | 'rig_vendor' | 'crane_vendor' | 'jcb_vendor'
  rate?: number
  rate_unit?: string
  start_date?: Date
  end_date?: Date
  status: 'active' | 'completed' | 'terminated'
  created_at?: Date
}

interface ProjectVendorCreationAttributes extends Optional<ProjectVendorAttributes, 'id' | 'created_at'> {}

class ProjectVendor extends Model<ProjectVendorAttributes, ProjectVendorCreationAttributes> implements ProjectVendorAttributes {
  public id!: number
  public project_id!: number
  public vendor_id!: number
  public vendor_type!: ProjectVendorAttributes['vendor_type']
  public rate?: number
  public rate_unit?: string
  public start_date?: Date
  public end_date?: Date
  public status!: ProjectVendorAttributes['status']
  public readonly created_at!: Date
}

ProjectVendor.init(
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
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'vendors',
        key: 'id',
      },
    },
    vendor_type: {
      type: DataTypes.ENUM('steel_contractor', 'concrete_contractor', 'rig_vendor', 'crane_vendor', 'jcb_vendor'),
      allowNull: false,
    },
    rate: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    rate_unit: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('active', 'completed', 'terminated'),
      defaultValue: 'active',
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'project_vendors',
    timestamps: false,
  }
)

export default ProjectVendor
