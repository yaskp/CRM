
import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface WorkTemplateAttributes {
    id: number
    name: string
    description?: string
    is_active: boolean
    created_at?: Date
    updated_at?: Date
}

interface WorkTemplateCreationAttributes extends Optional<WorkTemplateAttributes, 'id' | 'is_active'> { }

class WorkTemplate extends Model<WorkTemplateAttributes, WorkTemplateCreationAttributes> implements WorkTemplateAttributes {
    public id!: number
    public name!: string
    public description?: string
    public is_active!: boolean
    public readonly created_at!: Date
    public readonly updated_at!: Date

    public static associate(models: any) {
        WorkTemplate.hasMany(models.WorkTemplateItem, { as: 'items', foreignKey: 'template_id' });
    }
}

WorkTemplate.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        }
    },
    {
        sequelize,
        tableName: 'work_templates',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
)

export default WorkTemplate
