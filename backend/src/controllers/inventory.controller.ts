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

        return res.json({
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
        return next(error)
    }
}

export const getStockStatement = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { warehouse_id, project_id, search } = req.query
        const wId = warehouse_id ? Number(warehouse_id) : null
        const pId = project_id ? Number(project_id) : null

        if (!wId && !pId) {
            return res.json({ success: true, statement: [] })
        }

        // Logic to calculate various quantities for the statement
        // 1. PO Quantity (Total ordered for this destination)
        // 2. Received Quantity (GRN items accepted)
        // 3. Used Quantity (Consumption)
        // 4. Transfer In/Out (STN)
        // 5. Balance (Current Stock)

        const query = `
            SELECT 
                m.id as material_id,
                m.name as material_name,
                m.material_code,
                m.unit,
                m.category,
                -- PO Quantity (Total Ordered)
                COALESCE((
                    SELECT SUM(poi.quantity) 
                    FROM purchase_order_items poi 
                    JOIN purchase_orders po ON po.id = poi.po_id 
                    WHERE poi.material_id = m.id 
                    AND po.status != 'rejected'
                    AND (:wId IS NULL OR po.warehouse_id = :wId)
                    AND (:pId IS NULL OR po.project_id = :pId)
                ), 0) as po_qty,
                -- Received Quantity (GRN Approved - Good Stock)
                COALESCE((
                    SELECT SUM(CASE 
                        WHEN ti.item_status = 'Defective' THEN 0 -- Exclude legacy defective items from Good Stock
                        ELSE ti.accepted_quantity 
                    END) 
                    FROM store_transaction_items ti 
                    JOIN store_transactions t ON t.id = ti.transaction_id 
                    WHERE ti.material_id = m.id AND t.status = 'approved' AND t.transaction_type = 'GRN'
                    AND (:wId IS NULL OR t.warehouse_id = :wId)
                    AND (:pId IS NULL OR t.to_project_id = :pId)
                ), 0) as received_qty,
                -- Rejected Quantity (GRN Approved - Defective/Returned immediately or held)
                COALESCE((
                    SELECT SUM(CASE 
                        WHEN ti.rejected_quantity > 0 THEN ti.rejected_quantity 
                        WHEN ti.item_status = 'Defective' THEN ti.quantity -- Catch legacy defective items
                        ELSE 0 
                    END) 
                    FROM store_transaction_items ti 
                    JOIN store_transactions t ON t.id = ti.transaction_id 
                    WHERE ti.material_id = m.id AND t.status = 'approved' AND t.transaction_type = 'GRN'
                    AND (:wId IS NULL OR t.warehouse_id = :wId)
                    AND (:pId IS NULL OR t.to_project_id = :pId)
                ), 0) as rejected_qty,
                -- Used Quantity (Consumption Approved)
                COALESCE((
                    SELECT SUM(ti.quantity) 
                    FROM store_transaction_items ti 
                    JOIN store_transactions t ON t.id = ti.transaction_id 
                    WHERE ti.material_id = m.id AND t.status = 'approved' AND t.transaction_type = 'CONSUMPTION'
                    AND (:wId IS NULL OR t.warehouse_id = :wId)
                    AND (:pId IS NULL OR t.project_id = :pId)
                ), 0) as used_qty,
                -- Transfer Out (STN Outward)
                COALESCE((
                    SELECT SUM(ti.quantity) 
                    FROM store_transaction_items ti 
                    JOIN store_transactions t ON t.id = ti.transaction_id 
                    WHERE ti.material_id = m.id AND t.status = 'approved' AND t.transaction_type = 'STN'
                    AND (:wId IS NULL OR t.warehouse_id = :wId)
                    AND (:pId IS NULL OR t.from_project_id = :pId)
                ), 0) as transfer_out,
                -- Transfer In (STN Inward)
                COALESCE((
                    SELECT SUM(ti.quantity) 
                    FROM store_transaction_items ti 
                    JOIN store_transactions t ON t.id = ti.transaction_id 
                    WHERE ti.material_id = m.id AND t.status = 'approved' AND t.transaction_type = 'STN'
                    AND (:wId IS NULL OR t.to_warehouse_id = :wId)
                    AND (:pId IS NULL OR t.to_project_id = :pId)
                ), 0) as transfer_in,
                -- SRN Out (Returned FROM this location)
                COALESCE((
                    SELECT SUM(ti.quantity) 
                    FROM store_transaction_items ti 
                    JOIN store_transactions t ON t.id = ti.transaction_id 
                    WHERE ti.material_id = m.id AND t.status = 'approved' AND t.transaction_type = 'SRN'
                    AND (:wId IS NULL OR t.warehouse_id = :wId)
                    AND (:pId IS NULL OR t.from_project_id = :pId OR (t.source_type='project' AND t.project_id = :pId))
                ), 0) as srn_out,
                -- SRN In (Returned TO this location)
                COALESCE((
                    SELECT SUM(ti.quantity) 
                    FROM store_transaction_items ti 
                    JOIN store_transactions t ON t.id = ti.transaction_id 
                    WHERE ti.material_id = m.id AND t.status = 'approved' AND t.transaction_type = 'SRN'
                    AND (:wId IS NULL OR t.to_warehouse_id = :wId)
                    AND (:pId IS NULL OR t.to_project_id = :pId) -- Added explicit pId check
                ), 0) as srn_in
            FROM materials m
            WHERE 1=1
            ${search ? `AND (m.name LIKE :searchPattern OR m.material_code LIKE :searchPattern)` : ''}
            HAVING po_qty > 0 OR received_qty > 0 OR rejected_qty > 0 OR used_qty > 0 OR transfer_out > 0 OR transfer_in > 0 OR srn_out > 0 OR srn_in > 0
            ORDER BY m.name ASC
        `

        const results = await sequelize.query(query, {
            replacements: {
                wId,
                pId,
                searchPattern: search ? `%${search}%` : ''
            },
            type: QueryTypes.SELECT
        })

        // Final calculation for balance
        const statement = results.map((row: any) => ({
            ...row,
            po_qty: Number(row.po_qty),
            received_qty: Number(row.received_qty),
            rejected_qty: Number(row.rejected_qty),
            used_qty: Number(row.used_qty),
            transfer_out: Number(row.transfer_out),
            transfer_in: Number(row.transfer_in),
            srn_out: Number(row.srn_out),
            srn_in: Number(row.srn_in),
            balance_qty: (Number(row.received_qty) + Number(row.transfer_in) + Number(row.srn_in)) - (Number(row.used_qty) + Number(row.transfer_out) + Number(row.srn_out))
        }))

        return res.json({ success: true, statement })
    } catch (error) {
        next(error)
    }
}

import { sequelize } from '../database/connection'
