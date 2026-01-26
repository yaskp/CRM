import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface ProjectZoneAttributes {
    id: number
    floor_id: number
    work_item_type_id?: number
    name: string
    zone_type: 'flat' | 'office' | 'shop' | 'common_area' | 'parking_slot' | 'other'
    area_sqft?: number
    created_at?: Date
    updated_at?: Date
}

interface ProjectZoneCreationAttributes extends Optional<ProjectZoneAttributes, 'id' | 'created_at' | 'updated_at'> { }

class ProjectZone extends Model<ProjectZoneAttributes, ProjectZoneCreationAttributes> implements ProjectZoneAttributes {
    public id!: number
    public floor_id!: number
    public work_item_type_id?: number
    public name!: string
    public zone_type!: ProjectZoneAttributes['zone_type']
    public area_sqft?: number
    public readonly created_at!: Date
    public readonly updated_at!: Date
}

ProjectZone.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        floor_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'project_floors',
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
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        zone_type: {
            type: DataTypes.ENUM('flat', 'office', 'shop', 'common_area', 'parking_slot', 'other'),
            defaultValue: 'flat',
        },
        area_sqft: {
            type: DataTypes.DECIMAL(10, 2),
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
        tableName: 'project_zones',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
)

export default ProjectZone
