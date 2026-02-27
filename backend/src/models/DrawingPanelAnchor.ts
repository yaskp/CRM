import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface DrawingPanelAnchorAttributes {
    id: number
    drawing_panel_id: number
    layer_number: number
    no_of_anchors: number
    anchor_length: number
    anchor_capacity?: number
    created_at?: Date
}

interface DrawingPanelAnchorCreationAttributes extends Optional<DrawingPanelAnchorAttributes, 'id' | 'created_at'> { }

class DrawingPanelAnchor extends Model<DrawingPanelAnchorAttributes, DrawingPanelAnchorCreationAttributes> implements DrawingPanelAnchorAttributes {
    public id!: number
    public drawing_panel_id!: number
    public layer_number!: number
    public no_of_anchors!: number
    public anchor_length!: number
    public anchor_capacity!: number | null
    public readonly created_at!: Date
}

DrawingPanelAnchor.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        drawing_panel_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'drawing_panels',
                key: 'id',
            },
        },
        layer_number: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        no_of_anchors: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        anchor_length: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        anchor_capacity: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'drawing_panel_anchors',
        timestamps: false,
    }
)

export default DrawingPanelAnchor
