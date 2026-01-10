import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface EquipmentAttributes {
  id: number
  equipment_code: string
  name: string
  equipment_type: 'crane' | 'jcb' | 'rig' | 'grabbing_rig' | 'steel_bending_machine' | 'steel_cutting_machine' | 'water_tank' | 'pump' | 'other'
  manufacturer?: string
  model?: string
  registration_number?: string
  is_rental: boolean
  owner_vendor_id?: number
  created_at?: Date
}

interface EquipmentCreationAttributes extends Optional<EquipmentAttributes, 'id' | 'created_at'> {}

class Equipment extends Model<EquipmentAttributes, EquipmentCreationAttributes> implements EquipmentAttributes {
  public id!: number
  public equipment_code!: string
  public name!: string
  public equipment_type!: EquipmentAttributes['equipment_type']
  public manufacturer?: string
  public model?: string
  public registration_number?: string
  public is_rental!: boolean
  public owner_vendor_id?: number
  public readonly created_at!: Date
}

Equipment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    equipment_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    equipment_type: {
      type: DataTypes.ENUM('crane', 'jcb', 'rig', 'grabbing_rig', 'steel_bending_machine', 'steel_cutting_machine', 'water_tank', 'pump', 'other'),
      allowNull: false,
    },
    manufacturer: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    model: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    registration_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    is_rental: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    owner_vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'vendors',
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'equipment',
    timestamps: false,
  }
)

export default Equipment

