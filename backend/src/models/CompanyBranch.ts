import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface CompanyBranchAttributes {
    id: number
    company_id: number
    branch_name: string
    gstin: string
    state_code: string
    address?: string
    city?: string
    state?: string
    pincode?: string
    is_active: boolean
    created_at?: Date
    updated_at?: Date
}

interface CompanyBranchCreationAttributes extends Optional<CompanyBranchAttributes, 'id' | 'is_active' | 'created_at' | 'updated_at'> { }

class CompanyBranch extends Model<CompanyBranchAttributes, CompanyBranchCreationAttributes> implements CompanyBranchAttributes {
    public id!: number
    public company_id!: number
    public branch_name!: string
    public gstin!: string
    public state_code!: string
    public address?: string
    public city?: string
    public state?: string
    public pincode?: string
    public is_active!: boolean
    public readonly created_at!: Date
    public readonly updated_at!: Date
}

CompanyBranch.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        company_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'companies',
                key: 'id',
            },
        },
        branch_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        gstin: {
            type: DataTypes.STRING(20),
            allowNull: false,
        },
        state_code: {
            type: DataTypes.STRING(2),
            allowNull: false,
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
        },
    },
    {
        sequelize,
        tableName: 'company_branches',
        timestamps: true,
        underscored: true,
    }
)

export default CompanyBranch
