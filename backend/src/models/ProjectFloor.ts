import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface ProjectFloorAttributes {
    id: number
    building_id: number
    name: string
    floor_number?: number
    floor_type: 'basement' | 'ground' | 'parking' | 'typical' | 'terrace'
    created_at?: Date
    updated_at?: Date
}

interface ProjectFloorCreationAttributes extends Optional<ProjectFloorAttributes, 'id' | 'created_at' | 'updated_at'> { }

class ProjectFloor extends Model<ProjectFloorAttributes, ProjectFloorCreationAttributes> implements ProjectFloorAttributes {
    public id!: number
    public building_id!: number
    public name!: string
    public floor_number?: number
    public floor_type!: ProjectFloorAttributes['floor_type']
    public readonly created_at!: Date
    public readonly updated_at!: Date
}

ProjectFloor.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        building_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'project_buildings',
                key: 'id',
            },
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        floor_number: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        floor_type: {
            type: DataTypes.ENUM('basement', 'ground', 'parking', 'typical', 'terrace'),
            defaultValue: 'typical',
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
        tableName: 'project_floors',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
)

export default ProjectFloor
