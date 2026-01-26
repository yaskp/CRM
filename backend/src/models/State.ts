import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface StateAttributes {
    id: number
    name: string
    state_code: string // 2-digit GST state code
    is_active: boolean
    created_at?: Date
}

interface StateCreationAttributes extends Optional<StateAttributes, 'id' | 'is_active' | 'created_at'> { }

class State extends Model<StateAttributes, StateCreationAttributes> implements StateAttributes {
    public id!: number
    public name!: string
    public state_code!: string
    public is_active!: boolean
    public readonly created_at!: Date
}

State.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        state_code: {
            type: DataTypes.STRING(2),
            allowNull: false,
            unique: true,
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
        tableName: 'states',
        timestamps: false,
        underscored: true,
    }
)

export default State
