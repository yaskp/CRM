import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import PurchaseOrder from '../models/PurchaseOrder'
import { createError } from '../middleware/errorHandler'
import { generatePurchaseOrderPDF } from '../utils/pdfGenerator'

import { numberingService } from '../utils/numberingService'
import { detectGSTType, calculateGST } from '../utils/gstCalculator'
import Project from '../models/Project'
import Vendor from '../models/Vendor'
import PurchaseOrderItem from '../models/PurchaseOrderItem'
import ProjectBOQ from '../models/ProjectBOQ'
import ProjectBOQItem from '../models/ProjectBOQItem'
import WorkOrder from '../models/WorkOrder'
import { Op } from 'sequelize'

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
            notes,
            warehouse_id,
            delivery_type,
            company_state_code, // maybe provided from frontend or calculated
            vendor_state_code,
            annexure_id,
            boq_id
        } = req.body

        if (!items || !Array.isArray(items) || items.length === 0) {
            throw createError('Purchase Order must have at least one item', 400)
        }

        // Fetch Project and Vendor to get state codes if not provided
        const [project, vendor] = await Promise.all([
            Project.findByPk(project_id),
            Vendor.findByPk(vendor_id)
        ])

        if (!project || !vendor) {
            throw createError('Project or Vendor not found', 404)
        }

        // 1. Enforce Work Order check
        const activeWO = await WorkOrder.findOne({
            where: {
                project_id,
                status: { [Op.in]: ['approved', 'active'] }
            }
        })

        if (!activeWO) {
            throw createError('Cannot create Purchase Order without an approved/active Work Order for this project.', 403)
        }

        const finalCompanyStateCode = company_state_code || project.site_state_code || '27' // Default to Maharashtra if unknown
        const finalVendorStateCode = vendor_state_code || vendor.state_code

        const gst_type = detectGSTType(finalVendorStateCode || '', finalCompanyStateCode || '')

        // BOQ Validation: If a BOQ ID is provided, verify against it
        let activeBOQ = null
        if (boq_id) {
            activeBOQ = await ProjectBOQ.findOne({ where: { id: boq_id, project_id, status: 'approved' } })
            if (!activeBOQ) throw createError('Specified BOQ is not approved or belongs to a different project', 400)
        } else {
            // Find current active BOQ
            activeBOQ = await ProjectBOQ.findOne({ where: { project_id, status: 'approved' } })
        }

        // Calculate GST breakup from items
        let total_cgst = 0
        let total_sgst = 0
        let total_igst = 0

        // We use the total_amount passed or recalculate. 
        // For robustness, let's trust the frontend total but we NEED the GST breakup.
        // Usually, GST is calculated per item.

        const temp_number = numberingService.generateTempNumber('PO')

        const po = await PurchaseOrder.create({
            temp_number,
            project_id,
            vendor_id,
            total_amount,
            gst_type,
            cgst_amount: 0, // Will update after items
            sgst_amount: 0,
            igst_amount: 0,
            company_state_code: finalCompanyStateCode,
            vendor_state_code: finalVendorStateCode,
            delivery_type: delivery_type || 'central_warehouse',
            status: 'draft',
            created_by: req.user!.id,
            expected_delivery_date,
            shipping_address,
            payment_terms: Array.isArray(payment_terms) ? payment_terms.join(', ') : payment_terms,
            notes,
            warehouse_id,
            annexure_id,
            boq_id: activeBOQ?.id
        })

        const itemPromises = items.map(async (item: any) => {
            const breakup = calculateGST(item.quantity * item.unit_price, item.tax_percentage || 0, gst_type)
            total_cgst += breakup.cgst_amount
            total_sgst += breakup.sgst_amount
            total_igst += breakup.igst_amount

            // BOQ Tracking for each item
            if (item.boq_item_id) {
                const boqItem = await ProjectBOQItem.findByPk(item.boq_item_id)
                if (boqItem) {
                    const remaining = Number(boqItem.quantity) - Number(boqItem.ordered_quantity)
                    if (Number(item.quantity) > remaining) {
                        // Instead of blocking, we could flag this PO or log a warning
                        console.warn(`PO Item ${item.description} exceeds BOQ by ${Number(item.quantity) - remaining}`)
                    }
                }
            }

            return PurchaseOrderItem.create({
                po_id: po.id,
                material_id: item.material_id,
                description: item.description,
                quantity: item.quantity,
                unit: Array.isArray(item.unit) ? item.unit[0] : item.unit,
                unit_price: item.unit_price,
                tax_percentage: item.tax_percentage,
                tax_amount: breakup.total_gst,
                total_amount: breakup.grand_total,
                boq_item_id: item.boq_item_id,
                received_quantity: 0
            })
        })

        await Promise.all(itemPromises)

        // Update PO with calculated GST totals
        await po.update({
            cgst_amount: total_cgst,
            sgst_amount: total_sgst,
            igst_amount: total_igst,
            // total_amount: items.reduce((sum, item) => sum + (item.quantity * item.unit_price) + (calculateGST(item.quantity * item.unit_price, item.tax_percentage, gst_type).total_gst), 0)
        })

        // Refetch with items
        const finalPO = await PurchaseOrder.findByPk(po.id, {
            include: ['items', 'warehouse', 'annexure']
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

        // BOQ Tracking: If PO is linked to a BOQ, update the ordered quantities
        const poItems = await PurchaseOrderItem.findAll({ where: { po_id: id } })
        for (const item of poItems) {
            if (item.boq_item_id) {
                const boqItem = await ProjectBOQItem.findByPk(item.boq_item_id)
                if (boqItem) {
                    await boqItem.increment('ordered_quantity', { by: item.quantity })
                }
            }
        }

        // Generate the FINAL sequential PO Number
        const finalPoNumber = await numberingService.generatePoNumber()

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
            include: ['project', 'vendor', 'creator', 'items', 'warehouse', 'annexure']
        })


        res.json({
            success: true,
            purchaseOrders: orders
        })
    } catch (error) {
        next(error)
    }
}



export const updatePurchaseOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const {
            project_id,
            vendor_id,
            items,
            expected_delivery_date,
            shipping_address,
            payment_terms,
            notes,
            warehouse_id,
            delivery_type,
            company_state_code,
            vendor_state_code,
            annexure_id
        } = req.body

        const po = await PurchaseOrder.findByPk(id)
        if (!po) throw createError('Purchase Order not found', 404)

        const isAdmin = req.user?.roles?.includes('Admin')

        if (['approved', 'rejected'].includes(po.status) && !isAdmin) {
            throw createError('Cannot modify an Approved or Rejected Purchase Order. Admin access required.', 403)
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            throw createError('Purchase Order must have at least one item', 400)
        }

        const [project, vendor] = await Promise.all([
            Project.findByPk(project_id),
            Vendor.findByPk(vendor_id)
        ])
        if (!project || !vendor) throw createError('Project or Vendor not found', 404)

        const finalCompanyStateCode = company_state_code || project.site_state_code || '27'
        const finalVendorStateCode = vendor_state_code || vendor.state_code
        const gst_type = detectGSTType(finalVendorStateCode || '', finalCompanyStateCode || '')

        await po.update({
            project_id,
            vendor_id,
            warehouse_id,
            delivery_type,
            gst_type,
            company_state_code: finalCompanyStateCode,
            vendor_state_code: finalVendorStateCode,
            expected_delivery_date,
            shipping_address,
            payment_terms: Array.isArray(payment_terms) ? payment_terms.join(', ') : payment_terms,
            notes,
            annexure_id
        })

        await PurchaseOrderItem.destroy({ where: { po_id: id } })

        let total_cgst = 0
        let total_sgst = 0
        let total_igst = 0
        let calculated_total = 0

        const itemPromises = items.map(async (item: any) => {
            const quantity = Number(item.quantity)
            const unitPrice = Number(item.unit_price)
            const baseAmount = quantity * unitPrice

            const breakup = calculateGST(baseAmount, item.tax_percentage || 0, gst_type)

            total_cgst += breakup.cgst_amount
            total_sgst += breakup.sgst_amount
            total_igst += breakup.igst_amount
            calculated_total += breakup.grand_total

            return PurchaseOrderItem.create({
                po_id: po.id,
                material_id: item.material_id,
                description: item.description,
                quantity: quantity,
                unit: Array.isArray(item.unit) ? item.unit[0] : item.unit,
                unit_price: unitPrice,
                tax_percentage: item.tax_percentage,
                tax_amount: breakup.total_gst,
                total_amount: breakup.grand_total,
                boq_item_id: item.boq_item_id,
                received_quantity: 0
            })
        })

        await Promise.all(itemPromises)

        await po.update({
            cgst_amount: total_cgst,
            sgst_amount: total_sgst,
            igst_amount: total_igst,
            total_amount: calculated_total
        })

        const updatedPO = await PurchaseOrder.findByPk(id, {
            include: ['items']
        })

        res.json({
            success: true,
            message: 'Purchase Order Updated',
            purchaseOrder: updatedPO
        })

    } catch (error) {
        next(error)
    }
}

export const getPurchaseOrderById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const po = await PurchaseOrder.findByPk(id, {
            include: ['project', 'vendor', 'creator', { association: 'items', include: ['material'] }, 'warehouse', 'annexure']
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

export const downloadPurchaseOrderPDF = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const po = await PurchaseOrder.findByPk(id, {
            include: ['project', 'vendor', 'creator', { model: PurchaseOrderItem, as: 'items', include: ['material'] }, 'warehouse', 'annexure']
        })

        if (!po) {
            throw createError('Purchase Order not found', 404)
        }

        res.setHeader('Content-Type', 'application/pdf')
        res.setHeader('Content-Disposition', `attachment; filename=PO-${po.po_number || po.temp_number}.pdf`)

        generatePurchaseOrderPDF(po, res)

    } catch (error) {
        next(error)
    }
}
