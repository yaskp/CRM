import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface DrawingPanelAttributes {
  id: number
  drawing_id: number
  panel_identifier: string
  coordinates_json?: string
  panel_type?: string
  created_by: number
  created_at?: Date
}

interface DrawingPanelCreationAttributes extends Optional<DrawingPanelAttributes, 'id' | 'created_at'> {}

class DrawingPanel extends Model<DrawingPanelAttributes, DrawingPanelCreationAttributes> implements DrawingPanelAttributes {
  public id!: number
  public drawing_id!: number
  public panel_identifier!: string
  public coordinates_json?: string
  public panel_type?: string
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

