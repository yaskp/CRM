import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface MaterialAttributes {
  id: number
  material_code: string
  name: string
  category?: string
  unit: string
  hsn_code?: string
  gst_rate?: number
  is_active: boolean
  created_at?: Date
}

interface MaterialCreationAttributes extends Optional<MaterialAttributes, 'id' | 'created_at'> {}

class Material extends Model<MaterialAttributes, MaterialCreationAttributes> implements MaterialAttributes {
  public id!: number
  public material_code!: string
  public name!: string
  public category?: string
  public unit!: string
  public hsn_code?: string
  public gst_rate?: number
  public is_active!: boolean
  public readonly created_at!: Date
}

Material.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    material_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    unit: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    hsn_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    gst_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'materials',
    timestamps: false,
  }
)

export default Material

