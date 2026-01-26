import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface PurchaseOrderAttributes {
    id: number
    temp_number: string
    po_number?: string // only assigned upon approval
    project_id: number
    vendor_id: number
    total_amount: number
    status: 'draft' | 'pending_approval' | 'approved' | 'rejected'
    created_by: number
    approved_by?: number
    approved_at?: Date
    expected_delivery_date?: string
    shipping_address?: string
    payment_terms?: string
    notes?: string
    warehouse_id?: number
    gst_type?: 'intra_state' | 'inter_state'
    cgst_amount: number
    sgst_amount: number
    igst_amount: number
    company_state_code?: string
    vendor_state_code?: string
    delivery_type: 'direct_to_site' | 'central_warehouse' | 'mixed'
    annexure_id?: number
    boq_id?: number
    billing_unit_id?: number
    created_at?: Date
    updated_at?: Date
}

interface PurchaseOrderCreationAttributes extends Optional<PurchaseOrderAttributes, 'id' | 'po_number' | 'status' | 'created_at' | 'updated_at'> { }

class PurchaseOrder extends Model<PurchaseOrderAttributes, PurchaseOrderCreationAttributes> implements PurchaseOrderAttributes {
    public id!: number
    public temp_number!: string
    public po_number?: string
    public project_id!: number
    public vendor_id!: number
    public total_amount!: number
    public status!: PurchaseOrderAttributes['status']
    public created_by!: number
    public approved_by?: number
    public approved_at?: Date
    public expected_delivery_date?: string
    public shipping_address?: string
    public payment_terms?: string
    public notes?: string
    public warehouse_id?: number
    public gst_type?: 'intra_state' | 'inter_state'
    public cgst_amount!: number
    public sgst_amount!: number
    public igst_amount!: number
    public company_state_code?: string
    public vendor_state_code?: string
    public delivery_type!: 'direct_to_site' | 'central_warehouse' | 'mixed'
    public annexure_id?: number
    public boq_id?: number
    public readonly created_at!: Date
    public readonly updated_at!: Date
}

PurchaseOrder.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        temp_number: {
            type: DataTypes.STRING(50),
            allowNull: false,
            unique: true,
        },
        po_number: {
            type: DataTypes.STRING(50),
            allowNull: true,
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
        vendor_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'vendors',
                key: 'id',
            },
        },
        total_amount: {
            type: DataTypes.DECIMAL(15, 2),
            allowNull: false,
            defaultValue: 0,
        },
        expected_delivery_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        shipping_address: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        payment_terms: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        warehouse_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'warehouses',
                key: 'id',
            },
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
        company_state_code: {
            type: DataTypes.STRING(2),
            allowNull: true,
        },
        vendor_state_code: {
            type: DataTypes.STRING(2),
            allowNull: true,
        },
        delivery_type: {
            type: DataTypes.ENUM('direct_to_site', 'central_warehouse', 'mixed'),
            defaultValue: 'central_warehouse',
        },
        annexure_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'annexures',
                key: 'id',
            },
        },
        billing_unit_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'company_branches',
                key: 'id',
            }
        },
        boq_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'project_boqs',
                key: 'id',
            },
        },
        status: {
            type: DataTypes.ENUM('draft', 'pending_approval', 'approved', 'rejected'),
            defaultValue: 'draft',
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        approved_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        approved_at: {
            type: DataTypes.DATE,
            allowNull: true,
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
        tableName: 'purchase_orders',
        timestamps: true,
        underscored: true,
    }
)

export default PurchaseOrder
