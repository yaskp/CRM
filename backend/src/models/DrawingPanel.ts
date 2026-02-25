import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface DrawingPanelAttributes {
  id: number
  drawing_id: number
  panel_identifier: string
  coordinates_json?: string
  panel_type?: string
  design_depth?: number
  length?: number
  width?: number
  thickness?: number
  top_rl?: number
  bottom_rl?: number
  theoretical_concrete_volume?: number
  theoretical_steel_kg?: number
  reinforcement_ton?: number
  no_of_anchors?: number
  anchor_length?: number
  anchor_capacity?: number
  concrete_design_qty?: number
  grabbing_qty?: number
  stop_end_area?: number
  guide_wall_rm?: number
  ramming_qty?: number
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
  public length?: number
  public width?: number
  public thickness?: number
  public top_rl?: number
  public bottom_rl?: number
  public theoretical_concrete_volume?: number
  public theoretical_steel_kg?: number
  public reinforcement_ton?: number
  public no_of_anchors?: number
  public anchor_length?: number
  public anchor_capacity?: number
  public concrete_design_qty?: number
  public grabbing_qty?: number
  public stop_end_area?: number
  public guide_wall_rm?: number
  public ramming_qty?: number
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
    length: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    width: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    design_depth: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    top_rl: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    bottom_rl: {
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
    reinforcement_ton: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    no_of_anchors: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    anchor_length: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    anchor_capacity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    concrete_design_qty: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    grabbing_qty: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    stop_end_area: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    guide_wall_rm: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    ramming_qty: {
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

