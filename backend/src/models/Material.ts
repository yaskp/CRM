import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface MaterialAttributes {
  id: number
  material_code: string
  name: string
  category?: string
  unit: string | string[]
  hsn_code?: string
  gst_rate?: number
  is_active: boolean
  budget_head_id?: number
  standard_rate?: number
  uom?: string
  created_at?: Date
}

interface MaterialCreationAttributes extends Optional<MaterialAttributes, 'id' | 'created_at'> { }

class Material extends Model<MaterialAttributes, MaterialCreationAttributes> implements MaterialAttributes {
  public id!: number
  public material_code!: string
  public name!: string
  public category?: string
  public unit!: string | string[]
  public hsn_code?: string
  public gst_rate?: number
  public is_active!: boolean
  public budget_head_id?: number
  public standard_rate?: number
  public uom?: string
  public readonly created_at!: Date
}

Material.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    material_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    unit: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const rawValue = this.getDataValue('unit');
        try {
          // Attempt to parse if it looks like JSON array
          const parsed = JSON.parse(rawValue);
          if (Array.isArray(parsed)) return parsed;
          return [rawValue];
        } catch (e) {
          // If not valid JSON, assume it's a single legacy string
          return rawValue ? [rawValue] : [];
        }
      },
      set(value: string | string[]) {
        if (Array.isArray(value)) {
          this.setDataValue('unit', JSON.stringify(value));
        } else {
          // If simple string, store as single item array for consistency, or just string if legacy preference
          // Let's store as JSON array to be uniform
          this.setDataValue('unit', JSON.stringify([value]));
        }
      }
    },
    hsn_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    gst_rate: {
      type: DataTypes.DECIMAL(5, 2),
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
    budget_head_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'budget_heads',
        key: 'id'
      }
    },
    standard_rate: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: true,
    },
    uom: {
      type: DataTypes.STRING(20),
      allowNull: true,
    }
  },
  {
    sequelize,
    tableName: 'materials',
    timestamps: false,
  }
)

export default Material

