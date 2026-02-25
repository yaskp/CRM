import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface VendorContactAttributes {
    id: number
    vendor_id: number
    contact_name: string
    designation?: string
    email?: string
    phone?: string
    aadhar_number?: string
    is_primary: boolean
    created_at?: Date
    updated_at?: Date
}

interface VendorContactCreationAttributes extends Optional<VendorContactAttributes, 'id' | 'created_at' | 'updated_at'> { }

class VendorContact extends Model<VendorContactAttributes, VendorContactCreationAttributes> implements VendorContactAttributes {
    public id!: number
    public vendor_id!: number
    public contact_name!: string
    public designation?: string
    public email?: string
    public phone?: string
    public aadhar_number?: string
    public is_primary!: boolean
    public readonly created_at!: Date
    public readonly updated_at!: Date
}

VendorContact.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        vendor_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'vendors',
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
        aadhar_number: {
            type: DataTypes.STRING(12),
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
        tableName: 'vendor_contacts',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
)

export default VendorContact
