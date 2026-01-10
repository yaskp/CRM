import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface ExpenseAttributes {
  id: number
  expense_number: string
  project_id: number
  expense_type: 'conveyance' | 'loose_purchase' | 'food' | 'two_wheeler' | 'other'
  amount: number
  description?: string
  expense_date: Date
  bill_url?: string
  selfie_url?: string
  input_method: 'auto' | 'manual'
  bill_type?: 'kaccha_bill' | 'pakka_bill' | 'petrol_bill' | 'ola_uber_screenshot' | 'not_required'
  status: 'draft' | 'pending_approval_1' | 'pending_approval_2' | 'pending_approval_3' | 'approved' | 'rejected'
  submitted_by: number
  created_at?: Date
}

interface ExpenseCreationAttributes extends Optional<ExpenseAttributes, 'id' | 'created_at'> {}

class Expense extends Model<ExpenseAttributes, ExpenseCreationAttributes> implements ExpenseAttributes {
  public id!: number
  public expense_number!: string
  public project_id!: number
  public expense_type!: ExpenseAttributes['expense_type']
  public amount!: number
  public description?: string
  public expense_date!: Date
  public bill_url?: string
  public selfie_url?: string
  public input_method!: ExpenseAttributes['input_method']
  public bill_type?: ExpenseAttributes['bill_type']
  public status!: ExpenseAttributes['status']
  public submitted_by!: number
  public readonly created_at!: Date
}

Expense.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    expense_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    expense_type: {
      type: DataTypes.ENUM('conveyance', 'loose_purchase', 'food', 'two_wheeler', 'other'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    expense_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    bill_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    selfie_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    input_method: {
      type: DataTypes.ENUM('auto', 'manual'),
      defaultValue: 'manual',
    },
    bill_type: {
      type: DataTypes.ENUM('kaccha_bill', 'pakka_bill', 'petrol_bill', 'ola_uber_screenshot', 'not_required'),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending_approval_1', 'pending_approval_2', 'pending_approval_3', 'approved', 'rejected'),
      defaultValue: 'draft',
    },
    submitted_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'expenses',
    timestamps: false,
  }
)

export default Expense

