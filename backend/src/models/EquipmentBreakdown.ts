import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface EquipmentBreakdownAttributes {
  id: number
  rental_id: number
  breakdown_date: Date
  breakdown_time?: string
  resolution_date?: Date
  resolution_time?: string
  breakdown_hours?: number
  breakdown_reason?: string
  deduction_amount?: number
  reported_by: number
  created_at?: Date
}

interface EquipmentBreakdownCreationAttributes extends Optional<EquipmentBreakdownAttributes, 'id' | 'created_at'> {}

class EquipmentBreakdown extends Model<EquipmentBreakdownAttributes, EquipmentBreakdownCreationAttributes> implements EquipmentBreakdownAttributes {
  public id!: number
  public rental_id!: number
  public breakdown_date!: Date
  public breakdown_time?: string
  public resolution_date?: Date
  public resolution_time?: string
  public breakdown_hours?: number
  public breakdown_reason?: string
  public deduction_amount?: number
  public reported_by!: number
  public readonly created_at!: Date
}

EquipmentBreakdown.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    rental_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'equipment_rentals',
        key: 'id',
      },
    },
    breakdown_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    breakdown_time: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    resolution_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    resolution_time: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    breakdown_hours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    breakdown_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    deduction_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    reported_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
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
    tableName: 'equipment_breakdowns',
    timestamps: false,
  }
)

export default EquipmentBreakdown

