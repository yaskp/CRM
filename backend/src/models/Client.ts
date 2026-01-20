import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface ClientAttributes {
    id: number
    client_code: string
    company_name: string
    contact_person?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    state?: string
    pincode?: string
    gstin?: string
    pan?: string
    payment_terms?: string
    credit_limit?: number
    client_type: 'individual' | 'company' | 'government'
    status: 'active' | 'inactive' | 'blocked'
    created_at?: Date
    updated_at?: Date
}

interface ClientCreationAttributes extends Optional<ClientAttributes, 'id' | 'created_at' | 'updated_at'> { }

class Client extends Model<ClientAttributes, ClientCreationAttributes> implements ClientAttributes {
    public id!: number
    public client_code!: string
    public company_name!: string
    public contact_person?: string
    public email?: string
    public phone?: string
    public address?: string
    public city?: string
    public state?: string
    public pincode?: string
    public gstin?: string
    public pan?: string
    public payment_terms?: string
    public credit_limit?: number
    public client_type!: ClientAttributes['client_type']
    public status!: ClientAttributes['status']
    public readonly created_at!: Date
    public readonly updated_at!: Date
}

Client.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        client_code: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },
        company_name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        contact_person: {
            type: DataTypes.STRING(255),
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
        address: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        city: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        state: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        pincode: {
            type: DataTypes.STRING(10),
            allowNull: true,
        },
        gstin: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        pan: {
            type: DataTypes.STRING(10),
            allowNull: true,
        },
        payment_terms: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        credit_limit: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: true,
            defaultValue: 0,
        },
        client_type: {
            type: DataTypes.ENUM('individual', 'company', 'government'),
            defaultValue: 'company',
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive', 'blocked'),
            defaultValue: 'active',
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
        tableName: 'clients',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
)

export default Client
