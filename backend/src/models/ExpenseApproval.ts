import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface ExpenseApprovalAttributes {
  id: number
  expense_id: number
  approval_level: number
  approver_role: string
  approver_id?: number
  status: 'pending' | 'approved' | 'rejected'
  comments?: string
  approved_at?: Date
  created_at?: Date
}

interface ExpenseApprovalCreationAttributes extends Optional<ExpenseApprovalAttributes, 'id' | 'created_at'> {}

class ExpenseApproval extends Model<ExpenseApprovalAttributes, ExpenseApprovalCreationAttributes> implements ExpenseApprovalAttributes {
  public id!: number
  public expense_id!: number
  public approval_level!: number
  public approver_role!: string
  public approver_id?: number
  public status!: ExpenseApprovalAttributes['status']
  public comments?: string
  public approved_at?: Date
  public readonly created_at!: Date
}

ExpenseApproval.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    expense_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'expenses',
        key: 'id',
      },
    },
    approval_level: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    approver_role: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    approver_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending',
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'expense_approvals',
    timestamps: false,
  }
)

export default ExpenseApproval

