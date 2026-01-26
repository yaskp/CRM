import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface VendorAttributes {
  id: number
  name: string
  vendor_type: string
  contact_person?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  state_code?: string
  pincode?: string
  gst_number?: string
  pan_number?: string
  bank_name?: string
  account_number?: string
  ifsc_code?: string
  branch?: string
  bank_details?: string
  is_active: boolean
  created_at?: Date
}

interface VendorCreationAttributes extends Optional<VendorAttributes, 'id' | 'created_at'> { }

class Vendor extends Model<VendorAttributes, VendorCreationAttributes> implements VendorAttributes {
  public id!: number
  public name!: string
  public vendor_type!: VendorAttributes['vendor_type']
  public contact_person?: string
  public phone?: string
  public email?: string
  public address?: string
  public city?: string
  public state?: string
  public state_code?: string
  public pincode?: string
  public gst_number?: string
  public pan_number?: string
  public bank_name?: string
  public account_number?: string
  public ifsc_code?: string
  public branch?: string
  public bank_details?: string
  public is_active!: boolean
  public readonly created_at!: Date
}

Vendor.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    vendor_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    contact_person: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
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
    state_code: {
      type: DataTypes.STRING(2),
      allowNull: true,
    },
    pincode: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    gst_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    pan_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    bank_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    account_number: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    ifsc_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    branch: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    bank_details: {
      type: DataTypes.TEXT,
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
  },
  {
    sequelize,
    tableName: 'vendors',
    timestamps: false,
  }
)

export default Vendor
