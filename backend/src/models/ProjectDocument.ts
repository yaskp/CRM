import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

// Project Documents - Document management
interface ProjectDocumentAttributes {
    id: number
    project_id: number
    document_type: 'contract' | 'drawing' | 'boq' | 'approval' | 'certificate' | 'quotation' | 'work_order' | 'other'
    document_name: string
    file_path: string
    file_type?: string
    file_size?: number
    description?: string
    uploaded_by: number
    version?: number
    is_active: boolean
    created_at?: Date
    updated_at?: Date
}

interface ProjectDocumentCreationAttributes extends Optional<ProjectDocumentAttributes,
    'id' | 'created_at' | 'updated_at' | 'is_active' | 'version'
> { }

class ProjectDocument extends Model<ProjectDocumentAttributes, ProjectDocumentCreationAttributes>
    implements ProjectDocumentAttributes {
    public id!: number
    public project_id!: number
    public document_type!: ProjectDocumentAttributes['document_type']
    public document_name!: string
    public file_path!: string
    public file_type?: string
    public file_size?: number
    public description?: string
    public uploaded_by!: number
    public version?: number
    public is_active!: boolean

    public readonly created_at!: Date
    public readonly updated_at!: Date
}

ProjectDocument.init(
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
        document_type: {
            type: DataTypes.ENUM('contract', 'drawing', 'boq', 'approval', 'certificate', 'quotation', 'work_order', 'other'),
            allowNull: false,
        },
        document_name: {
            type: DataTypes.STRING(200),
            allowNull: false,
        },
        file_path: {
            type: DataTypes.STRING(500),
            allowNull: false,
        },
        file_type: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        file_size: {
            type: DataTypes.BIGINT,
            allowNull: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        uploaded_by: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        version: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 1,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            allowNull: false,
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
        tableName: 'project_documents',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            { fields: ['project_id'] },
            { fields: ['document_type'] },
            { fields: ['is_active'] },
        ],
    }
)

export default ProjectDocument
