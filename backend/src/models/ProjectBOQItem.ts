import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface ProjectBOQItemAttributes {
    id: number
    boq_id: number
    material_id: number
    work_item_type_id?: number
    building_id?: number
    floor_id?: number
    zone_id?: number
    quantity: number
    unit?: string
    estimated_rate: number
    estimated_amount: number
    ordered_quantity: number
    consumed_quantity: number
    total_completed_work?: number
    remarks?: string
    created_at?: Date
    updated_at?: Date
}

interface ProjectBOQItemCreationAttributes extends Optional<ProjectBOQItemAttributes, 'id' | 'work_item_type_id' | 'building_id' | 'floor_id' | 'zone_id' | 'unit' | 'estimated_rate' | 'estimated_amount' | 'ordered_quantity' | 'consumed_quantity' | 'total_completed_work' | 'remarks' | 'created_at' | 'updated_at'> { }

class ProjectBOQItem extends Model<ProjectBOQItemAttributes, ProjectBOQItemCreationAttributes> implements ProjectBOQItemAttributes {
    public id!: number
    public boq_id!: number
    public material_id!: number
    public work_item_type_id?: number
    public building_id?: number
    public floor_id?: number
    public zone_id?: number
    public quantity!: number
    public unit?: string
    public estimated_rate!: number
    public estimated_amount!: number
    public ordered_quantity!: number
    public consumed_quantity!: number
    public total_completed_work?: number
    public remarks?: string
    public readonly created_at!: Date
    public readonly updated_at!: Date
}

ProjectBOQItem.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        boq_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'project_boqs',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },
        material_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'materials',
                key: 'id',
            },
        },
        work_item_type_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'work_item_types',
                key: 'id',
            },
        },
        building_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'project_buildings',
                key: 'id',
            },
        },
        floor_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'project_floors',
                key: 'id',
            },
        },
        zone_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'project_zones',
                key: 'id',
            },
        },
        quantity: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
        },
        unit: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        estimated_rate: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
        },
        estimated_amount: {
            type: DataTypes.DECIMAL(15, 2),
            // This is a generated column in MySQL, so we must not send it on INSERT/UPDATE
            // Note: Sequelize will still read it during SELECT
        },
        ordered_quantity: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
        },
        consumed_quantity: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
        },
        total_completed_work: {
            type: DataTypes.DECIMAL(15, 2),
            defaultValue: 0,
        },
        remarks: {
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
        tableName: 'project_boq_items',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
)

export default ProjectBOQItem
