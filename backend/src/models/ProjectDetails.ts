import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

// Extended project details - Financial, Timeline, Technical
interface ProjectDetailsAttributes {
    id: number
    project_id: number

    // Site Details
    site_address?: string
    site_area?: number
    site_area_unit?: 'sqft' | 'sqm' | 'acre' | 'hectare'
    site_latitude?: string
    site_longitude?: string

    // Financial
    contract_value?: number
    budget_amount?: number
    payment_terms?: string
    advance_percentage?: number
    retention_percentage?: number

    // Timeline
    start_date?: Date
    expected_end_date?: Date
    actual_end_date?: Date
    duration_days?: number
    completion_percentage?: number

    // Design & Technical
    architect_name?: string
    architect_contact?: string
    consultant_name?: string
    consultant_contact?: string
    total_floors?: number
    basement_floors?: number
    built_up_area?: number
    carpet_area?: number

    // Scope
    scope_of_work?: string
    specifications?: string
    special_requirements?: string
    remarks?: string
    cancellation_reason?: string

    created_at?: Date
    updated_at?: Date
}

interface ProjectDetailsCreationAttributes extends Optional<ProjectDetailsAttributes,
    'id' | 'created_at' | 'updated_at'
> { }

class ProjectDetails extends Model<ProjectDetailsAttributes, ProjectDetailsCreationAttributes>
    implements ProjectDetailsAttributes {
    public id!: number
    public project_id!: number

    public site_address?: string
    public site_area?: number
    public site_area_unit?: ProjectDetailsAttributes['site_area_unit']
    public site_latitude?: string
    public site_longitude?: string

    public contract_value?: number
    public budget_amount?: number
    public payment_terms?: string
    public advance_percentage?: number
    public retention_percentage?: number

    public start_date?: Date
    public expected_end_date?: Date
    public actual_end_date?: Date
    public duration_days?: number
    public completion_percentage?: number

    public architect_name?: string
    public architect_contact?: string
    public consultant_name?: string
    public consultant_contact?: string
    public total_floors?: number
    public basement_floors?: number
    public built_up_area?: number
    public carpet_area?: number

    public scope_of_work?: string
    public specifications?: string
    public special_requirements?: string
    public remarks?: string
    public cancellation_reason?: string

    public readonly created_at!: Date
    public readonly updated_at!: Date
}

ProjectDetails.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        project_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
                model: 'projects',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },

        // Site Details
        site_address: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        site_area: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        site_area_unit: {
            type: DataTypes.ENUM('sqft', 'sqm', 'acre', 'hectare'),
            allowNull: true,
            defaultValue: 'sqft',
        },
        site_latitude: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },
        site_longitude: {
            type: DataTypes.STRING(50),
            allowNull: true,
        },

        // Financial
        contract_value: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
        },
        budget_amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
        },
        payment_terms: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        advance_percentage: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
        },
        retention_percentage: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
        },

        // Timeline
        start_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        expected_end_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        actual_end_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        duration_days: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        completion_percentage: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            defaultValue: 0,
        },

        // Design & Technical
        architect_name: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        architect_contact: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        consultant_name: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        consultant_contact: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        total_floors: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        basement_floors: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        built_up_area: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        carpet_area: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },

        // Scope
        scope_of_work: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        specifications: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        special_requirements: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        cancellation_reason: {
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
        tableName: 'project_details',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [
            { fields: ['project_id'] },
            { fields: ['start_date'] },
            { fields: ['expected_end_date'] },
        ],
    }
)

export default ProjectDetails
