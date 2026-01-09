import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface QuotationAttributes {
  id: number
  lead_id: number
  version_number: number
  quotation_number: string
  total_amount: number
  discount_percentage?: number
  final_amount: number
  payment_terms?: string
  valid_until?: Date
  status: 'draft' | 'sent' | 'accepted' | 'rejected'
  pdf_url?: string
  created_by: number
  created_at?: Date
}

interface QuotationCreationAttributes extends Optional<QuotationAttributes, 'id' | 'created_at'> {}

class Quotation extends Model<QuotationAttributes, QuotationCreationAttributes> implements QuotationAttributes {
  public id!: number
  public lead_id!: number
  public version_number!: number
  public quotation_number!: string
  public total_amount!: number
  public discount_percentage?: number
  public final_amount!: number
  public payment_terms?: string
  public valid_until?: Date
  public status!: QuotationAttributes['status']
  public pdf_url?: string
  public created_by!: number
  public readonly created_at!: Date
}

Quotation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    lead_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'leads',
        key: 'id',
      },
    },
    version_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    quotation_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    total_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    discount_percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    final_amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    payment_terms: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    valid_until: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'sent', 'accepted', 'rejected'),
      defaultValue: 'draft',
    },
    pdf_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    created_by: {
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
    tableName: 'quotations',
    timestamps: false,
  }
)

export default Quotation

