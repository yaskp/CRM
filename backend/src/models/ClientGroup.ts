import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface ClientGroupAttributes {
    id: number
    group_name: string
    group_type: 'corporate' | 'sme' | 'government' | 'individual' | 'retail'
    description?: string
    created_at?: Date
    updated_at?: Date
}

interface ClientGroupCreationAttributes extends Optional<ClientGroupAttributes, 'id' | 'created_at' | 'updated_at'> { }

class ClientGroup extends Model<ClientGroupAttributes, ClientGroupCreationAttributes> implements ClientGroupAttributes {
    public id!: number
    public group_name!: string
    public group_type!: ClientGroupAttributes['group_type']
    public description?: string
    public readonly created_at!: Date
    public readonly updated_at!: Date
}

ClientGroup.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        group_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        group_type: {
            type: DataTypes.ENUM('corporate', 'sme', 'government', 'individual', 'retail'),
            allowNull: false,
            defaultValue: 'corporate',
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
        tableName: 'client_groups',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
)

export default ClientGroup
