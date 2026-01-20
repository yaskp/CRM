
import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface UnitAttributes {
    id: number
    name: string
    code: string
    base_unit_id?: number | null
    conversion_factor?: number
    is_active: boolean
    created_at?: Date
}

interface UnitCreationAttributes extends Optional<UnitAttributes, 'id' | 'created_at' | 'is_active' | 'base_unit_id' | 'conversion_factor'> { }

class Unit extends Model<UnitAttributes, UnitCreationAttributes> implements UnitAttributes {
    public id!: number
    public name!: string
    public code!: string
    public base_unit_id!: number | null
    public conversion_factor!: number
    public is_active!: boolean
    public readonly created_at!: Date
}

Unit.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        code: {
            type: DataTypes.STRING(20),
            allowNull: false,
            unique: true,
        },
        base_unit_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        conversion_factor: {
            type: DataTypes.DECIMAL(10, 4),
            defaultValue: 1.0,
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'units',
        timestamps: false,
    }
)

export default Unit
