import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import Inventory from '../models/Inventory'
import Material from '../models/Material'
import Warehouse from '../models/Warehouse'
import { Op } from 'sequelize'

export const getInventory = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { warehouse_id, search, low_stock, page = 1, limit = 10 } = req.query
        console.log('GET /inventory Params:', { warehouse_id, search, low_stock })

        const offset = (Number(page) - 1) * Number(limit)

        const where: any = {}

        if (warehouse_id) {
            where.warehouse_id = warehouse_id
        }

        if (low_stock === 'true') {
            // Checking if quantity is below min_stock_level
            where.quantity = { [Op.lte]: sequelize.col('min_stock_level') }
        }

        const include: any[] = [
            {
                model: Warehouse,
                as: 'warehouse',
                attributes: ['id', 'name', 'code']
            },
            {
                model: Material,
                as: 'material',
                attributes: ['id', 'name', 'material_code', 'unit', 'category'],
                where: search ? {
                    [Op.or]: [
                        { name: { [Op.like]: `%${search}%` } },
                        { material_code: { [Op.like]: `%${search}%` } }
                    ]
                } : undefined
            }
        ]

        const { count, rows } = await Inventory.findAndCountAll({
            where,
            include,
            limit: Number(limit),
            offset,
            order: [
                ['warehouse_id', 'ASC'],
                [{ model: Material, as: 'material' }, 'name', 'ASC']
            ]
        })

        res.json({
            success: true,
            inventory: rows,
            pagination: {
                total: count,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(count / Number(limit))
            }
        })
    } catch (error) {
        next(error)
    }
}

import { sequelize } from '../database/connection'
