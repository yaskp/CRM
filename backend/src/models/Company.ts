import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface CompanyAttributes {
  id: number
  name: string
  code: string
  created_at?: Date
}

interface CompanyCreationAttributes extends Optional<CompanyAttributes, 'id' | 'created_at'> {}

class Company extends Model<CompanyAttributes, CompanyCreationAttributes> implements CompanyAttributes {
  public id!: number
  public name!: string
  public code!: string
  public readonly created_at!: Date
}

Company.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'companies',
    timestamps: false,
  }
)

export default Company

