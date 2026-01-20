import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import PurchaseOrder from '../models/PurchaseOrder'
import { createError } from '../middleware/errorHandler'
import { Op } from 'sequelize'

// Generate string like TMP-PO-<TIMESTAMP>
const generateTempNumber = () => {
    return `TMP-PO-${Date.now()}`
}

// Generate sequential PO number: PO-YYYY-XXXX (e.g. PO-2026-0001)
const generatePoNumber = async () => {
    const year = new Date().getFullYear()
    const prefix = `PO-${year}-`

    // Find the last approved PO number for this year
    const lastPO = await PurchaseOrder.findOne({
        where: {
            po_number: { [Op.like]: `${prefix}%` }
        },
        order: [['po_number', 'DESC']]
    })

    let nextSequence = 1
    if (lastPO && lastPO.po_number) {
        const lastSequenceStr = lastPO.po_number.split('-').pop()
        if (lastSequenceStr) {
            nextSequence = parseInt(lastSequenceStr, 10) + 1
        }
    }

    return `${prefix}${String(nextSequence).padStart(4, '0')}`
}

import PurchaseOrderItem from '../models/PurchaseOrderItem'

// ...

export const createPurchaseOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const {
            project_id,
            vendor_id,
            total_amount,
            items,
            expected_delivery_date,
            shipping_address,
            payment_terms,
            notes
        } = req.body

        if (!items || !Array.isArray(items) || items.length === 0) {
            throw createError('Purchase Order must have at least one item', 400)
        }

        const temp_number = generateTempNumber()

        const po = await PurchaseOrder.create({
            temp_number,
            project_id,
            vendor_id,
            total_amount,
            status: 'draft',
            created_by: req.user!.id,
            expected_delivery_date,
            shipping_address,
            payment_terms,
            notes
        })

        const itemPromises = items.map((item: any) => {
            return PurchaseOrderItem.create({
                po_id: po.id,
                material_id: item.material_id, // can be null
                description: item.description,
                quantity: item.quantity,
                unit: item.unit,
                unit_price: item.unit_price,
                tax_percentage: item.tax_percentage,
                tax_amount: item.tax_amount,
                total_amount: item.total_amount
            })
        })

        await Promise.all(itemPromises)

        // Refetch with items
        const finalPO = await PurchaseOrder.findByPk(po.id, {
            include: ['items']
        })

        res.status(201).json({
            success: true,
            message: 'Purchase Order created (Draft)',
            purchaseOrder: finalPO
        })
    } catch (error) {
        next(error)
    }
}

export const approvePurchaseOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const po = await PurchaseOrder.findByPk(id)

        if (!po) {
            throw createError('Purchase Order not found', 404)
        }

        if (po.status === 'approved') {
            throw createError('Purchase Order is already approved', 400)
        }

        // Generate the FINAL sequential PO Number
        const finalPoNumber = await generatePoNumber()

        await po.update({
            status: 'approved',
            po_number: finalPoNumber,
            approved_by: req.user!.id,
            approved_at: new Date()
        })

        res.json({
            success: true,
            message: 'Purchase Order Approved',
            purchaseOrder: po
        })
    } catch (error) {
        next(error)
    }
}

export const rejectPurchaseOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const po = await PurchaseOrder.findByPk(id)

        if (!po) {
            throw createError('Purchase Order not found', 404)
        }

        if (po.status === 'approved') {
            throw createError('Cannot reject an already approved Purchase Order', 400)
        }

        // Rejected POs do NOT consume a PO number. They stay with just a temp number.
        await po.update({
            status: 'rejected'
        })

        res.json({
            success: true,
            message: 'Purchase Order Rejected',
            purchaseOrder: po
        })
    } catch (error) {
        next(error)
    }
}

export const getPurchaseOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { vendor_id, status } = req.query
        const where: any = {}

        if (vendor_id) where.vendor_id = vendor_id
        if (status) where.status = status

        const orders = await PurchaseOrder.findAll({
            where,
            order: [['created_at', 'DESC']],
            include: ['project', 'vendor', 'creator', 'items']
        })


        res.json({
            success: true,
            purchaseOrders: orders
        })
    } catch (error) {
        next(error)
    }
}

export const getPurchaseOrderById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const po = await PurchaseOrder.findByPk(id, {
            include: ['project', 'vendor', 'creator', 'items']
        })

        if (!po) {
            throw createError('Purchase Order not found', 404)
        }

        res.json({
            success: true,
            purchaseOrder: po
        })
    } catch (error) {
        next(error)
    }
}
