import { Model, DataTypes } from 'sequelize'
import { sequelize } from '../database/connection'

class BudgetHead extends Model {
    public id!: number
    public name!: string
    public code!: string
    public type!: 'group' | 'item'
    public parent_id!: number | null
}

BudgetHead.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    type: {
        type: DataTypes.ENUM('group', 'item'),
        defaultValue: 'item'
    },
    parent_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'budget_heads',
            key: 'id'
        }
    }
}, {
    sequelize,
    tableName: 'budget_heads',
    timestamps: true
})

export default BudgetHead
