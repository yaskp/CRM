import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface ProjectBuildingAttributes {
    id: number
    project_id: number
    name: string
    building_code?: string
    work_item_type_id?: number
    description?: string
    created_at?: Date
    updated_at?: Date
}

interface ProjectBuildingCreationAttributes extends Optional<ProjectBuildingAttributes, 'id' | 'created_at' | 'updated_at'> { }

class ProjectBuilding extends Model<ProjectBuildingAttributes, ProjectBuildingCreationAttributes> implements ProjectBuildingAttributes {
    public id!: number
    public project_id!: number
    public name!: string
    public building_code?: string
    public work_item_type_id?: number
    public description?: string
    public readonly created_at!: Date
    public readonly updated_at!: Date
}

ProjectBuilding.init(
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
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        building_code: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        work_item_type_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'work_item_types',
                key: 'id',
            },
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'project_buildings',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
)

export default ProjectBuilding
