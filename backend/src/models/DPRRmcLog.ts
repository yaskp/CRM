import { DataTypes, Model, Optional } from 'sequelize'
import { sequelize } from '../database/connection'

interface DPRRmcLogAttributes {
    id: number
    dpr_id: number
    vehicle_no: string
    quantity: number
    slump?: number
    in_time?: string
    start_time?: string
    out_time?: string
    remarks?: string
    drawing_panel_id?: number
    created_at?: Date
}

interface DPRRmcLogCreationAttributes extends Optional<DPRRmcLogAttributes, 'id' | 'created_at'> { }

class DPRRmcLog extends Model<DPRRmcLogAttributes, DPRRmcLogCreationAttributes> implements DPRRmcLogAttributes {
    public id!: number
    public dpr_id!: number
    public vehicle_no!: string
    public quantity!: number
    public slump?: number
    public in_time?: string
    public start_time?: string
    public out_time?: string
    public remarks?: string
    public drawing_panel_id?: number
    public readonly created_at!: Date
}

DPRRmcLog.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        dpr_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        vehicle_no: {
            type: DataTypes.STRING(50),
            allowNull: false,
        },
        quantity: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        slump: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        in_time: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        start_time: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        out_time: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
        remarks: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        drawing_panel_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'drawing_panels',
                key: 'id',
            }
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'dpr_rmc_logs',
        timestamps: false,
    }
)

export default DPRRmcLog
