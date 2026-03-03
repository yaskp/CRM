import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface StoreTransactionAttributes {
  id: number
  transaction_number: string
  transaction_type: 'GRN' | 'STN' | 'SRN' | 'CONSUMPTION'

  source_type?: 'warehouse' | 'project' | 'vendor'
  destination_type?: 'warehouse' | 'project' | 'vendor'

  warehouse_id?: number // Now nullable (represents Source Warehouse)
  to_warehouse_id?: number // Nullable (represents Dest Warehouse)

  // Specific Project References
  from_project_id?: number
  to_project_id?: number // Distinct from project_id for clarity in transfers? Or reuse?

  // Vendor Return fields
  vendor_id?: number
  purchase_order_id?: number
  temp_number?: string
  cgst_amount: number
  sgst_amount: number
  igst_amount: number

  project_id?: number // Legacy/Generic project ref
  to_building_id?: number
  to_floor_id?: number
  to_zone_id?: number
  drawing_panel_id?: number

  transaction_date: Date
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  remarks?: string
  created_by: number
  approved_by?: number
  truck_number?: string
  driver_name?: string
  driver_phone?: string
  quality_check_status?: 'pending' | 'passed' | 'failed' | 'partial'
  inspector_name?: string
  inspection_date?: Date
  challan_number?: string
  supplier_invoice_number?: string
  lorry_receipt_number?: string
  eway_bill_number?: string
  challan_image?: string
  invoice_image?: string
  goods_image?: string
  receiver_image?: string
  manpower_data?: string
  machinery_data?: string
  weather_condition?: string
  temperature?: number
  work_hours?: string
  progress_photos?: string

  // D-Wall Specific Technical Fields
  actual_depth?: number
  verticality_x?: number
  verticality_y?: number
  slurry_density?: number
  slurry_viscosity?: number
  slurry_sand_content?: number
  cage_id_ref?: string
  start_time?: string
  end_time?: string
  slump_flow?: number
  tremie_pipe_count?: number
  theoretical_concrete_qty?: number
  grabbing_start_time?: string
  grabbing_end_time?: string
  concrete_grade?: string
  overbreak_percentage?: number
  grabbing_depth?: number
  grabbing_sqm?: number
  concreting_depth?: number
  concreting_sqm?: number

  // Multi-item progress logs (JSON)
  pile_work_logs?: string | any[]
  panel_work_logs?: string | any[]

  // ERP Linkage FKs
  work_order_id?: number   // → work_orders  (for contractor billing from DPR)
  quotation_id?: number    // → quotations    (client quotation this bill is linked to)
  boq_id?: number          // → project_boqs  (cost vs budget tracking)

  created_at?: Date
}

interface StoreTransactionCreationAttributes extends Optional<StoreTransactionAttributes, 'id' | 'created_at'> { }

class StoreTransaction extends Model<StoreTransactionAttributes, StoreTransactionCreationAttributes> implements StoreTransactionAttributes {
  public id!: number
  public transaction_number!: string
  public transaction_type!: StoreTransactionAttributes['transaction_type']

  public source_type?: 'warehouse' | 'project' | 'vendor'
  public destination_type?: 'warehouse' | 'project' | 'vendor'

  public warehouse_id?: number
  public to_warehouse_id?: number

  public from_project_id?: number
  public to_project_id?: number
  public vendor_id?: number
  public purchase_order_id?: number
  public temp_number?: string
  public cgst_amount!: number
  public sgst_amount!: number
  public igst_amount!: number
  public project_id?: number
  public to_building_id?: number
  public to_floor_id?: number
  public to_zone_id?: number
  public drawing_panel_id?: number

  public transaction_date!: Date
  public status!: StoreTransactionAttributes['status']
  public remarks?: string
  public created_by!: number
  public approved_by?: number
  public truck_number?: string
  public driver_name?: string
  public driver_phone?: string
  public quality_check_status?: 'pending' | 'passed' | 'failed' | 'partial'
  public inspector_name?: string
  public inspection_date?: Date
  public challan_number?: string
  public supplier_invoice_number?: string
  public lorry_receipt_number?: string
  public eway_bill_number?: string
  public challan_image?: string
  public invoice_image?: string
  public goods_image?: string
  public receiver_image?: string
  public manpower_data?: string
  public machinery_data?: string
  public weather_condition?: string
  public temperature?: number
  public work_hours?: string
  public progress_photos?: string

  // D-Wall Specific Technical Fields
  public actual_depth?: number
  public verticality_x?: number
  public verticality_y?: number
  public slurry_density?: number
  public slurry_viscosity?: number
  public slurry_sand_content?: number
  public cage_id_ref?: string
  public start_time?: string
  public end_time?: string
  public slump_flow?: number
  public tremie_pipe_count?: number
  public theoretical_concrete_qty?: number
  public grabbing_start_time?: string
  public grabbing_end_time?: string
  public concrete_grade?: string
  public overbreak_percentage?: number
  public grabbing_depth?: number
  public grabbing_sqm?: number
  public concreting_depth?: number
  public concreting_sqm?: number

  public pile_work_logs?: any
  public panel_work_logs?: any

  public work_order_id?: number
  public quotation_id?: number
  public boq_id?: number

  public readonly created_at!: Date
}

StoreTransaction.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    transaction_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    transaction_type: {
      type: DataTypes.ENUM('GRN', 'STN', 'SRN', 'CONSUMPTION'),
      allowNull: false,
    },
    source_type: {
      type: DataTypes.ENUM('warehouse', 'project', 'vendor'),
      defaultValue: 'warehouse',
      allowNull: true
    },
    destination_type: {
      type: DataTypes.ENUM('warehouse', 'project', 'vendor'),
      defaultValue: 'warehouse',
      allowNull: true
    },
    warehouse_id: {
      type: DataTypes.INTEGER,
      allowNull: true, // Changed from false
      references: {
        model: 'warehouses',
        key: 'id',
      },
    },
    to_warehouse_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'warehouses',
        key: 'id',
      },
    },
    from_project_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    to_project_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    vendor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'vendors',
        key: 'id',
      },
    },
    purchase_order_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'purchase_orders',
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
    to_building_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'project_buildings',
        key: 'id',
      },
    },
    to_floor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'project_floors',
        key: 'id',
      },
    },
    to_zone_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'project_zones',
        key: 'id',
      },
    },
    drawing_panel_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'drawing_panels',
        key: 'id',
      },
    },
    temp_number: {
      type: DataTypes.STRING(50),
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
    transaction_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending', 'approved', 'rejected'),
      defaultValue: 'draft',
    },
    remarks: {
      type: DataTypes.TEXT,
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
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    truck_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    driver_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    driver_phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    quality_check_status: {
      type: DataTypes.ENUM('pending', 'passed', 'failed', 'partial'),
      defaultValue: 'pending',
    },
    inspector_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    inspection_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    challan_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    supplier_invoice_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    lorry_receipt_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    eway_bill_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    challan_image: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    invoice_image: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    goods_image: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    receiver_image: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    manpower_data: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    machinery_data: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    weather_condition: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    temperature: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    work_hours: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    progress_photos: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    actual_depth: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    verticality_x: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    verticality_y: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    slurry_density: {
      type: DataTypes.DECIMAL(5, 3),
      allowNull: true,
    },
    slurry_viscosity: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    slurry_sand_content: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    cage_id_ref: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    start_time: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    end_time: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    slump_flow: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    tremie_pipe_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    theoretical_concrete_qty: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    grabbing_start_time: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    grabbing_end_time: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    concrete_grade: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    overbreak_percentage: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    grabbing_depth: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    grabbing_sqm: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    concreting_depth: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    concreting_sqm: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    pile_work_logs: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    panel_work_logs: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    work_order_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'work_orders', key: 'id' },
    },
    quotation_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'quotations', key: 'id' },
    },
    boq_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'project_boqs', key: 'id' },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'store_transactions',
    timestamps: false,
  }
)

export default StoreTransaction

