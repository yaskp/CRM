import { Model, DataTypes } from 'sequelize'
import { sequelize } from '../database/connection'

class ProjectBudget extends Model {
    public id!: number
    public project_id!: number
    public budget_head_id!: number
    public estimated_amount!: number
    public alert_threshold!: number // Percentage, e.g. 80
}

ProjectBudget.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    project_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'projects',
            key: 'id'
        }
    },
    budget_head_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'budget_heads',
            key: 'id'
        }
    },
    estimated_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0
    },
    alert_threshold: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 80.00
    }
}, {
    sequelize,
    tableName: 'project_budgets',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['project_id', 'budget_head_id']
        }
    ]
})


export default ProjectBudget
