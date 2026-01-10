import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface ManpowerReportAttributes {
  id: number
  dpr_id: number
  worker_type: 'steel_worker' | 'concrete_worker' | 'department_worker' | 'electrician' | 'welder'
  count: number
  hajri: '1' | '1.5' | '2'
  created_at?: Date
}

interface ManpowerReportCreationAttributes extends Optional<ManpowerReportAttributes, 'id' | 'created_at'> {}

class ManpowerReport extends Model<ManpowerReportAttributes, ManpowerReportCreationAttributes> implements ManpowerReportAttributes {
  public id!: number
  public dpr_id!: number
  public worker_type!: ManpowerReportAttributes['worker_type']
  public count!: number
  public hajri!: ManpowerReportAttributes['hajri']
  public readonly created_at!: Date
}

ManpowerReport.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    dpr_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'daily_progress_reports',
        key: 'id',
      },
    },
    worker_type: {
      type: DataTypes.ENUM('steel_worker', 'concrete_worker', 'department_worker', 'electrician', 'welder'),
      allowNull: false,
    },
    count: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    hajri: {
      type: DataTypes.ENUM('1', '1.5', '2'),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'manpower_reports',
    timestamps: false,
  }
)

export default ManpowerReport

