import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface WorkerCategoryAttributes {
    id: number
    name: string
    created_at?: Date
    updated_at?: Date
}

interface WorkerCategoryCreationAttributes extends Optional<WorkerCategoryAttributes, 'id' | 'created_at' | 'updated_at'> { }

class WorkerCategory extends Model<WorkerCategoryAttributes, WorkerCategoryCreationAttributes> implements WorkerCategoryAttributes {
    public id!: number
    public name!: string
    public readonly created_at!: Date
    public readonly updated_at!: Date
}

WorkerCategory.init(
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
    },
    {
        sequelize,
        tableName: 'worker_categories',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    }
)

export default WorkerCategory
