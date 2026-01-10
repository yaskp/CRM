import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

// Project Milestones - Timeline tracking
interface ProjectMilestoneAttributes {
    id: number
    project_id: number
    milestone_name: string
    milestone_type: 'design' | 'approval' | 'mobilization' | 'construction' | 'inspection' | 'completion' | 'payment' | 'other'
    planned_date?: Date
    actual_date?: Date
    status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled'
    completion_percentage?: number
    description?: string
    remarks?: string
    created_by: number
    created_at?: Date
    updated_at?: Date
}

interface ProjectMilestoneCreationAttributes extends Optional<ProjectMilestoneAttributes,
    'id' | 'created_at' | 'updated_at' | 'completion_percentage' | 'status'
> { }

class ProjectMilestone extends Model<ProjectMilestoneAttributes, ProjectMilestoneCreationAttributes>
    implements ProjectMilestoneAttributes {
    public id!: number
    public project_id!: number
    public milestone_name!: string
    public milestone_type!: ProjectMilestoneAttributes['milestone_type']
    public planned_date?: Date
    public actual_date?: Date
    public status!: ProjectMilestoneAttributes['status']
    public completion_percentage?: number
    public description?: string
    public remarks?: string
    public created_by!: number

    public readonly created_at!: Date
    public readonly updated_at!: Date
}

ProjectMilestone.init(
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
            onDelete: 'CASCADE',
        },
        milestone_name: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        milestone_type: {
            type: DataTypes.ENUM('design', 'approval', 'mobilization', 'construction', 'inspection', 'completion', 'payment', 'other'),
            allowNull: false,
        },
        planned_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        actual_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'delayed', 'cancelled'),
            defaultValue: 'pending',
            allowNull: false,
        },
        completion_percentage: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            defaultValue: 0,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        remarks: {
            type: DataTypes.TEXT,
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
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'project_milestones',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            { fields: ['project_id'] },
            { fields: ['milestone_type'] },
            { fields: ['status'] },
            { fields: ['planned_date'] },
        ],
    }
)

export default ProjectMilestone
