import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface DrawingAttributes {
  id: number
  project_id: number
  drawing_number?: string
  drawing_name?: string
  drawing_type?: string
  file_url?: string
  file_type?: string
  file_size?: number
  uploaded_by: number
  uploaded_at?: Date
  version: number
  is_active: boolean
}

interface DrawingCreationAttributes extends Optional<DrawingAttributes, 'id' | 'uploaded_at'> { }

class Drawing extends Model<DrawingAttributes, DrawingCreationAttributes> implements DrawingAttributes {
  public id!: number
  public project_id!: number
  public drawing_number?: string
  public drawing_name?: string
  public drawing_type?: string
  public file_url?: string
  public file_type?: string
  public file_size?: number
  public uploaded_by!: number
  public uploaded_at!: Date
  public version!: number
  public is_active!: boolean
}

Drawing.init(
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
    drawing_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    drawing_name: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    drawing_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    file_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    file_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    file_size: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    uploaded_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    uploaded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'drawings',
    timestamps: false,
  }
)

export default Drawing

