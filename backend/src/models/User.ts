import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'
import bcrypt from 'bcrypt'

interface UserAttributes {
  id: number
  employee_id: string
  username: string
  name: string
  email: string
  phone?: string
  password_hash: string
  company_id?: number
  is_active: boolean
  last_login?: Date
  created_at?: Date
  updated_at?: Date
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'created_at' | 'updated_at' | 'last_login'> { }

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number
  public employee_id!: string
  public username!: string
  public name!: string
  public email!: string
  public phone?: string
  public password_hash!: string
  public company_id?: number
  public is_active!: boolean
  public last_login?: Date

  public readonly created_at!: Date
  public readonly updated_at!: Date

  public async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password_hash)
  }

  // Association mixins
  public setRoles!: (roles: any[]) => Promise<void>
  public getRoles!: () => Promise<any[]>
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    employee_id: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'companies',
        key: 'id',
      },
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    last_login: {
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
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password_hash) {
          const salt = await bcrypt.genSalt(10)
          user.password_hash = await bcrypt.hash(user.password_hash, salt)
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password_hash')) {
          const salt = await bcrypt.genSalt(10)
          user.password_hash = await bcrypt.hash(user.password_hash, salt)
        }
      },
    },
  }
)

export default User

