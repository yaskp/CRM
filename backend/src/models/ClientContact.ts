import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface ClientContactAttributes {
    id: number
    client_id: number
    contact_name: string
    designation?: string
    email?: string
    phone?: string
    is_primary: boolean
    created_at?: Date
    updated_at?: Date
}

interface ClientContactCreationAttributes extends Optional<ClientContactAttributes, 'id' | 'created_at' | 'updated_at'> { }

class ClientContact extends Model<ClientContactAttributes, ClientContactCreationAttributes> implements ClientContactAttributes {
    public id!: number
    public client_id!: number
    public contact_name!: string
    public designation?: string
    public email?: string
    public phone?: string
    public is_primary!: boolean
    public readonly created_at!: Date
    public readonly updated_at!: Date
}

ClientContact.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        client_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'clients',
                key: 'id',
            },
        },
        contact_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        designation: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        is_primary: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
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
        tableName: 'client_contacts',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
)

export default ClientContact
