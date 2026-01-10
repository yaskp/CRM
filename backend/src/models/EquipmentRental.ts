import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface EquipmentRentalAttributes {
  id: number
  project_id: number
  equipment_id: number
  vendor_id: number
  start_date: Date
  end_date?: Date
  rate_per_day?: number
  rate_per_sq_meter?: number
  total_days?: number
  total_amount?: number
  breakdown_deduction_amount: number
  net_amount?: number
  status: 'active' | 'completed' | 'terminated'
  created_at?: Date
}

interface EquipmentRentalCreationAttributes extends Optional<EquipmentRentalAttributes, 'id' | 'created_at'> {}

class EquipmentRental extends Model<EquipmentRentalAttributes, EquipmentRentalCreationAttributes> implements EquipmentRentalAttributes {
  public id!: number
  public project_id!: number
  public equipment_id!: number
  public vendor_id!: number
  public start_date!: Date
  public end_date?: Date
  public rate_per_day?: number
  public rate_per_sq_meter?: number
  public total_days?: number
  public total_amount?: number
  public breakdown_deduction_amount!: number
  public net_amount?: number
  public status!: EquipmentRentalAttributes['status']
  public readonly created_at!: Date
}

EquipmentRental.init(
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
    equipment_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'equipment',
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
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    rate_per_day: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    rate_per_sq_meter: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    total_days: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    total_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    breakdown_deduction_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
    net_amount: {
      type: DataTypes.DECIMAL(15, 2),
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
    tableName: 'equipment_rentals',
    timestamps: false,
  }
)

export default EquipmentRental

