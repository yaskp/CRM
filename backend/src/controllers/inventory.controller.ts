import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import Inventory from '../models/Inventory'
import Material from '../models/Material'
import Warehouse from '../models/Warehouse'
import { Op, QueryTypes } from 'sequelize'

export const getInventory = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { warehouse_id, project_id, search, low_stock, page = 1, limit = 10 } = req.query
        console.log('GET /inventory Params:', { warehouse_id, project_id, search, low_stock })

        // PROJECT INVENTORY (CALCULATED)
        if (project_id) {
            // Calculate inventory dynamically for project
            const pId = Number(project_id)

            // Raw Query to sum ins and outs
            // STN In: to_project_id = pId AND destination_type = 'project' (or just check to_project_id)
            // SRN Out: from_project_id = pId AND source_type = 'project'
            // Consumption Out: project_id = pId AND transaction_type = 'CONSUMPTION'

            // Using COALESCE to handle potentially null fields in legacy data if needed, but primary logic:
            // Input: STN -> to_project_id
            // Output: SRN -> from_project_id
            // Output: CONSUMPTION -> project_id

            const results = await sequelize.query(`
                SELECT 
                    m.id as material_id,
                    m.name as material_name,
                    m.material_code,
                    m.unit,
                    m.category,
                    COALESCE(SUM(CASE 
                        WHEN t.transaction_type = 'STN' AND t.to_project_id = :pId THEN ti.quantity 
                        WHEN t.transaction_type = 'GRN' AND t.to_project_id = :pId THEN ti.quantity
                        ELSE 0 
                    END), 0) -
                    COALESCE(SUM(CASE 
                        WHEN t.transaction_type = 'SRN' AND t.from_project_id = :pId THEN ti.quantity
                        WHEN t.transaction_type = 'CONSUMPTION' AND t.project_id = :pId THEN ti.quantity
                        ELSE 0 
                    END), 0) as quantity
                FROM materials m
                LEFT JOIN store_transaction_items ti ON ti.material_id = m.id
                LEFT JOIN store_transactions t ON t.id = ti.transaction_id AND t.status = 'approved'
                WHERE (t.to_project_id = :pId OR t.from_project_id = :pId OR t.project_id = :pId)
                ${search ? `AND (m.name LIKE :search OR m.material_code LIKE :search)` : ''}
                GROUP BY m.id
                HAVING quantity > 0
            `, {
                replacements: {
                    pId,
                    search: search ? `%${search}%` : undefined
                },
                type: QueryTypes.SELECT
            })

            // Format to match standard inventory response
            const inventory = results.map((row: any) => ({
                id: row.material_id, // Virtual ID
                warehouse_id: null,
                material_id: row.material_id,
                quantity: Number(row.quantity),
                reserved_quantity: 0,
                material: {
                    id: row.material_id,
                    name: row.material_name,
                    material_code: row.material_code,
                    unit: row.unit,
                    category: row.category
                }
            }))

            return res.json({
                success: true,
                inventory,
                pagination: {
                    total: inventory.length,
                    page: 1,
                    limit: 1000,
                    pages: 1
                }
            })
        }

        // WAREHOUSE INVENTORY (STANDARD TABLE)
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
