import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface AnnexureAttributes {
    id: number
    name: string
    description?: string
    clauses: string[]
    client_scope?: string
    contractor_scope?: string
    payment_terms?: string
    delivery_terms?: string
    quality_terms?: string
    warranty_terms?: string
    penalty_clause?: string
    type: 'client_scope' | 'contractor_scope' | 'payment_terms' | 'general_terms' | 'purchase_order'
    is_active: boolean
    created_at?: Date
    updated_at?: Date
}

interface AnnexureCreationAttributes extends Optional<AnnexureAttributes, 'id' | 'created_at' | 'updated_at'> { }

class Annexure extends Model<AnnexureAttributes, AnnexureCreationAttributes> implements AnnexureAttributes {
    public id!: number
    public name!: string
    public description?: string
    public clauses!: string[]
    public client_scope?: string
    public contractor_scope?: string
    public payment_terms?: string
    public delivery_terms?: string
    public quality_terms?: string
    public warranty_terms?: string
    public penalty_clause?: string
    public type!: AnnexureAttributes['type']
    public is_active!: boolean
    public readonly created_at!: Date
    public readonly updated_at!: Date
}

Annexure.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        clauses: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: []
        },
        client_scope: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        contractor_scope: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        payment_terms: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        delivery_terms: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        quality_terms: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        warranty_terms: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        penalty_clause: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        type: {
            type: DataTypes.ENUM('client_scope', 'contractor_scope', 'payment_terms', 'general_terms', 'purchase_order'),
            defaultValue: 'general_terms',
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        }
    },
    {
        sequelize,
        tableName: 'annexures',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
)

export default Annexure
