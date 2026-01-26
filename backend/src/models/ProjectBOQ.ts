import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface ProjectBOQAttributes {
    id: number
    project_id: number
    title: string
    version: number
    status: 'draft' | 'approved' | 'revised' | 'obsolete'
    total_estimated_amount: number
    created_by: number
    approved_by?: number
    approved_at?: Date
    is_active: boolean
    created_at?: Date
    updated_at?: Date
}

interface ProjectBOQCreationAttributes extends Optional<ProjectBOQAttributes, 'id' | 'version' | 'status' | 'total_estimated_amount' | 'is_active' | 'created_at' | 'updated_at'> { }

class ProjectBOQ extends Model<ProjectBOQAttributes, ProjectBOQCreationAttributes> implements ProjectBOQAttributes {
    public id!: number
    public project_id!: number
    public title!: string
    public version!: number
    public status!: ProjectBOQAttributes['status']
    public total_estimated_amount!: number
    public created_by!: number
    public approved_by?: number
    public approved_at?: Date
    public is_active!: boolean
    public readonly created_at!: Date
    public readonly updated_at!: Date
}

ProjectBOQ.init(
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
        title: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        version: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
        },
        status: {
            type: DataTypes.ENUM('draft', 'approved', 'revised', 'obsolete'),
            defaultValue: 'draft',
        },
        total_estimated_amount: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        approved_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        approved_at: {
            type: DataTypes.DATE,
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
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'project_boqs',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
)

export default ProjectBOQ
