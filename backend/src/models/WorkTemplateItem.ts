
import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface WorkTemplateItemAttributes {
    id: number
    template_id: number
    work_item_type_id: number
    item_type: 'material' | 'labour' | 'contract'
    description?: string
    unit?: string
    sort_order: number
    created_at?: Date
}

interface WorkTemplateItemCreationAttributes extends Optional<WorkTemplateItemAttributes, 'id' | 'sort_order' | 'created_at'> { }

class WorkTemplateItem extends Model<WorkTemplateItemAttributes, WorkTemplateItemCreationAttributes> implements WorkTemplateItemAttributes {
    public id!: number
    public template_id!: number
    public work_item_type_id!: number
    public item_type!: 'material' | 'labour' | 'contract'
    public description?: string
    public unit?: string
    public sort_order!: number
    public readonly created_at!: Date

    public static associate(models: any) {
        WorkTemplateItem.belongsTo(models.WorkTemplate, { as: 'template', foreignKey: 'template_id' });
        WorkTemplateItem.belongsTo(models.WorkItemType, { as: 'workItemType', foreignKey: 'work_item_type_id' });
    }
}

WorkTemplateItem.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        template_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        work_item_type_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        item_type: {
            type: DataTypes.ENUM('material', 'labour', 'contract'),
            defaultValue: 'labour',
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        unit: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        sort_order: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        }
    },
    {
        sequelize,
        tableName: 'work_template_items',
        timestamps: false,
        createdAt: 'created_at',
    }
)

export default WorkTemplateItem
