import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface QuotationAttributes {
  id: number
  lead_id: number
  version_number: number
  quotation_number: string
  total_amount: number
  discount_percentage?: number
  gst_type?: 'intra_state' | 'inter_state'
  cgst_amount?: number
  sgst_amount?: number
  igst_amount?: number
  final_amount: number
  payment_terms?: string
  valid_until?: Date
  annexure_id?: number
  client_scope?: string
  contractor_scope?: string
  terms_conditions?: string
  remarks?: string
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'approved' | 'accepted_by_party' | 'superseded'
  pdf_url?: string
  created_by: number
  project_id?: number
  billing_unit_id?: number
  created_at?: Date
}

interface QuotationCreationAttributes extends Optional<QuotationAttributes, 'id' | 'created_at'> { }

class Quotation extends Model<QuotationAttributes, QuotationCreationAttributes> implements QuotationAttributes {
  public id!: number
  public lead_id!: number
  public version_number!: number
  public quotation_number!: string
  public total_amount!: number
  public discount_percentage?: number
  public gst_type?: 'intra_state' | 'inter_state'
  public cgst_amount?: number
  public sgst_amount?: number
  public igst_amount?: number
  public final_amount!: number
  public payment_terms?: string
  public valid_until?: Date
  public annexure_id?: number
  public client_scope?: string
  public contractor_scope?: string
  public terms_conditions?: string
  public remarks?: string
  public status!: QuotationAttributes['status']
  public pdf_url?: string
  public created_by!: number
  public project_id?: number
  public billing_unit_id?: number
  public items?: any[]
  public readonly created_at!: Date
  public readonly updated_at!: Date
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
    gst_type: {
      type: DataTypes.ENUM('intra_state', 'inter_state'),
      allowNull: true,
    },
    cgst_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    sgst_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
    },
    igst_amount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
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
    annexure_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'annexures',
        key: 'id'
      }
    },
    client_scope: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    contractor_scope: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    terms_conditions: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'sent', 'accepted', 'rejected', 'approved', 'accepted_by_party', 'superseded'),
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
    project_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    billing_unit_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'company_branches',
        key: 'id'
      }
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

