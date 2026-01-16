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

export const createPurchaseOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { project_id, vendor_id, total_amount } = req.body

        const temp_number = generateTempNumber()

        const po = await PurchaseOrder.create({
            temp_number,
            project_id,
            vendor_id,
            total_amount,
            status: 'draft',
            created_by: req.user!.id
        })

        res.status(201).json({
            success: true,
            message: 'Purchase Order created (Draft)',
            purchaseOrder: po
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
        const orders = await PurchaseOrder.findAll({
            order: [['created_at', 'DESC']],
            include: ['project', 'vendor', 'creator'] // Assuming associations are set up
        })

        res.json({
            success: true,
            purchaseOrders: orders
        })
    } catch (error) {
        next(error)
    }
}
