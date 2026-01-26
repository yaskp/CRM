
import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface WorkItemTypeAttributes {
    id: number
    name: string
    code?: string
    uom?: string
    description?: string
    is_active: boolean
    created_at?: Date
}

interface WorkItemTypeCreationAttributes extends Optional<WorkItemTypeAttributes, 'id' | 'created_at' | 'is_active'> { }

class WorkItemType extends Model<WorkItemTypeAttributes, WorkItemTypeCreationAttributes> implements WorkItemTypeAttributes {
    public id!: number
    public name!: string
    public code?: string
    public uom?: string
    public description?: string
    public is_active!: boolean
    public readonly created_at!: Date
}

WorkItemType.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        code: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        uom: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        description: {
            type: DataTypes.TEXT,
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
        tableName: 'work_item_types',
        timestamps: false,
    }
)

export default WorkItemType
