import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface DrawingPanelAttributes {
  id: number
  drawing_id: number
  panel_identifier: string
  coordinates_json?: string
  panel_type?: string
  design_depth?: number
  width?: number
  thickness?: number
  theoretical_concrete_volume?: number
  theoretical_steel_kg?: number
  created_by: number
  created_at?: Date
}

interface DrawingPanelCreationAttributes extends Optional<DrawingPanelAttributes, 'id' | 'created_at'> { }

class DrawingPanel extends Model<DrawingPanelAttributes, DrawingPanelCreationAttributes> implements DrawingPanelAttributes {
  public id!: number
  public drawing_id!: number
  public panel_identifier!: string
  public coordinates_json?: string
  public panel_type?: string
  public design_depth?: number
  public width?: number
  public thickness?: number
  public theoretical_concrete_volume?: number
  public theoretical_steel_kg?: number
  public created_by!: number
  public readonly created_at!: Date
}

DrawingPanel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    drawing_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'drawings',
        key: 'id',
      },
    },
    panel_identifier: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    coordinates_json: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    panel_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    design_depth: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    width: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    thickness: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    theoretical_concrete_volume: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    theoretical_steel_kg: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    created_by: {
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
    tableName: 'drawing_panels',
    timestamps: false,
  }
)

export default DrawingPanel

