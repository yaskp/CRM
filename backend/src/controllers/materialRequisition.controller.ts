import { Request, Response, NextFunction } from 'express'
import { Op } from 'sequelize'
import MaterialRequisition from '../models/MaterialRequisition'
import MaterialRequisitionItem from '../models/MaterialRequisitionItem'
import Material from '../models/Material'
import Project from '../models/Project'
import User from '../models/User'
import Inventory from '../models/Inventory'
import Unit from '../models/Unit'
import { createError } from '../middleware/errorHandler'
import { AuthRequest } from '../middleware/auth.middleware'

// Generate requisition number
const generateRequisitionNumber = async (): Promise<string> => {
    const today = new Date()
    const year = today.getFullYear().toString().slice(-2)
    const month = (today.getMonth() + 1).toString().padStart(2, '0')

    const prefix = `MR${year}${month}`

    const lastRequisition = await MaterialRequisition.findOne({
        where: {
            requisition_number: {
                [Op.like]: `${prefix}%`
            }
        },
        order: [['id', 'DESC']]
    })

    let sequence = 1
    if (lastRequisition) {
        const lastNumber = parseInt(lastRequisition.requisition_number.slice(-4))
        sequence = lastNumber + 1
    }

    return `${prefix}${sequence.toString().padStart(4, '0')}`
}

// Get all requisitions
export const getRequisitions = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { project_id, status, priority, from_date, to_date } = req.query

        const where: any = {}

        if (project_id) where.project_id = project_id
        if (status) where.status = status
        if (priority) where.priority = priority

        if (from_date || to_date) {
            where.requested_date = {}
            if (from_date) where.requested_date[Op.gte] = new Date(from_date as string)
            if (to_date) where.requested_date[Op.lte] = new Date(to_date as string)
        }

        const requisitions = await MaterialRequisition.findAll({
            where,
            include: [
                {
                    model: Project,
                    as: 'project',
                    attributes: ['id', 'name', 'project_code'],
                },
                {
                    model: User,
                    as: 'requester',
                    attributes: ['id', 'name', 'employee_id'],
                },
                {
                    model: User,
                    as: 'approver',
                    attributes: ['id', 'name', 'employee_id'],
                },
                {
                    model: MaterialRequisitionItem,
                    as: 'items',
                    include: [
                        {
                            model: Material,
                            as: 'material',
                            attributes: ['id', 'name', 'material_code', 'unit'],
                        },
                    ],
                },
            ],
            order: [['created_at', 'DESC']],
        })

        res.json({
            success: true,
            data: requisitions,
        })
    } catch (error) {
        next(error)
    }
}

// Get requisition by ID
export const getRequisition = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params

        const requisition = await MaterialRequisition.findByPk(id, {
            include: [
                {
                    model: Project,
                    as: 'project',
                    attributes: ['id', 'name', 'project_code', 'location'],
                },
                {
                    model: User,
                    as: 'requester',
                    attributes: ['id', 'name', 'employee_id', 'email'],
                },
                {
                    model: User,
                    as: 'approver',
                    attributes: ['id', 'name', 'employee_id'],
                },
                {
                    model: MaterialRequisitionItem,
                    as: 'items',
                    include: [
                        {
                            model: Material,
                            as: 'material',
                            attributes: ['id', 'name', 'material_code', 'unit', 'category'],
                        },
                    ],
                },
            ],
        })

        if (!requisition) {
            throw createError('Material requisition not found', 404)
        }

        res.json({
            success: true,
            data: requisition,
        })
    } catch (error) {
        next(error)
    }
}

// Create requisition
export const createRequisition = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const {
            project_id,
            from_warehouse_id,
            required_date,
            priority,
            items,
        } = req.body

        if (!project_id || !from_warehouse_id || !items || items.length === 0) {
            throw createError('Project ID, Warehouse ID and items are required', 400)
        }

        // Generate requisition number
        const requisition_number = await generateRequisitionNumber()

        // Create requisition
        const requisition = await MaterialRequisition.create({
            requisition_number,
            project_id,
            from_warehouse_id,
            requested_by: req.user!.id,
            requested_date: new Date(),
            required_date: required_date ? new Date(required_date) : undefined,
            priority: priority || 'medium',
            status: 'pending',
        })

        // Create requisition items
        const requisitionItems = items.map((item: any) => ({
            requisition_id: requisition.id,
            material_id: item.material_id,
            requested_quantity: item.requested_quantity,
            unit: item.unit || 'nos',
            issued_quantity: 0,
            building_id: item.building_id,
            floor_id: item.floor_id,
            zone_id: item.zone_id,
        }))

        await MaterialRequisitionItem.bulkCreate(requisitionItems)

        // Fetch complete requisition with items
        const completeRequisition = await MaterialRequisition.findByPk(requisition.id, {
            include: [
                {
                    model: MaterialRequisitionItem,
                    as: 'items',
                    include: [
                        {
                            model: Material,
                            as: 'material',
                        },
                    ],
                },
            ],
        })

        res.status(201).json({
            success: true,
            message: 'Material requisition created successfully',
            data: completeRequisition,
        })
    } catch (error) {
        next(error)
    }
}

// Update requisition
export const updateRequisition = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const { required_date, priority, items } = req.body

        const requisition = await MaterialRequisition.findByPk(id)

        if (!requisition) {
            throw createError('Material requisition not found', 404)
        }

        if (requisition.status !== 'pending') {
            throw createError('Cannot update requisition in current status', 400)
        }

        // Update requisition
        await requisition.update({
            required_date: required_date ? new Date(required_date) : requisition.required_date,
            priority: priority || requisition.priority,
        })

        // Update items if provided
        if (items && items.length > 0) {
            // Delete existing items
            await MaterialRequisitionItem.destroy({
                where: { requisition_id: id },
            })

            // Create new items
            const requisitionItems = items.map((item: any) => ({
                requisition_id: requisition.id,
                material_id: item.material_id,
                requested_quantity: item.requested_quantity,
                unit: item.unit || 'nos',
                issued_quantity: 0,
                building_id: item.building_id,
                floor_id: item.floor_id,
                zone_id: item.zone_id,
            }))

            await MaterialRequisitionItem.bulkCreate(requisitionItems)
        }

        // Fetch updated requisition
        const updatedRequisition = await MaterialRequisition.findByPk(id, {
            include: [
                {
                    model: MaterialRequisitionItem,
                    as: 'items',
                    include: [
                        {
                            model: Material,
                            as: 'material',
                        },
                    ],
                },
            ],
        })

        res.json({
            success: true,
            message: 'Material requisition updated successfully',
            data: updatedRequisition,
        })
    } catch (error) {
        next(error)
    }
}

// Approve/Reject requisition
export const approveRequisition = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params
        const { action, items } = req.body

        console.log('Approve Payload:', JSON.stringify(req.body, null, 2))

        if (!action || !['approve', 'reject'].includes(action)) {
            throw createError('Invalid action', 400)
        }

        const requisition = await MaterialRequisition.findByPk(id)

        if (!requisition) {
            throw createError('Material requisition not found', 404)
        }

        if (requisition.status !== 'pending') {
            throw createError('Requisition is not in pending status', 400)
        }

        if (!req.user?.roles?.some(role => ['Admin', 'Store Manager'].includes(role))) {
            throw createError('Only Store Managers or Admins can approve requisitions', 403)
        }

        if (action === 'approve') {
            // Update item issued quantities if provided
            if (items && items.length > 0) {
                // Helper to calculate stock unit quantity
                const getRequiredStockQty = async (materialId: number, issuedQty: number) => {
                    const originalItem = requisition.items?.find((i: any) => i.material_id === materialId)
                    const requestUnitCode = originalItem?.unit
                    const material = await Material.findByPk(materialId)
                    const stockUnitCode = material?.unit

                    let requiredInStockUnit = Number(issuedQty)

                    if (requestUnitCode && stockUnitCode && requestUnitCode !== stockUnitCode) {
                        const requestUnit = await Unit.findOne({ where: { code: requestUnitCode } })
                        const stockUnit = await Unit.findOne({ where: { code: stockUnitCode } })

                        if (requestUnit && stockUnit) {
                            // Check compatibility: Same base or one is base of other
                            // Simplification: We assume if they exist, we try conversion based on factors.
                            // In a robust system, we check Dimension/Base ID.
                            // For now, trust the Master Data.
                            const reqFactor = Number(requestUnit.conversion_factor || 1)
                            const stockFactor = Number(stockUnit.conversion_factor || 1)

                            requiredInStockUnit = (Number(issuedQty) * reqFactor) / stockFactor
                        }
                    }
                    return requiredInStockUnit
                }

                // First pass: Validate Stock
                for (const item of items) {
                    if (item.issued_quantity > 0) {
                        const invRecord = await Inventory.findOne({
                            where: {
                                warehouse_id: requisition.from_warehouse_id,
                                material_id: item.material_id
                            }
                        })

                        const availableStock = Number(invRecord?.quantity || 0)
                        const requiredQty = await getRequiredStockQty(item.material_id, item.issued_quantity)

                        // Check if inventory exists and has enough stock
                        if (!invRecord || availableStock < requiredQty) {
                            throw createError(`Insufficient stock for Material ID ${item.material_id}. Available: ${availableStock}. Required: ${requiredQty.toFixed(2)} (in stock units)`, 400)
                        }
                    }
                }

                // Second pass: Deduct Stock and Update Item
                for (const item of items) {
                    if (item.issued_quantity > 0) {
                        const invRecord = await Inventory.findOne({
                            where: {
                                warehouse_id: requisition.from_warehouse_id,
                                material_id: item.material_id
                            }
                        })

                        const requiredQty = await getRequiredStockQty(item.material_id, item.issued_quantity)

                        if (invRecord) {
                            await invRecord.decrement('quantity', { by: requiredQty })
                        }
                    }

                    await MaterialRequisitionItem.update(
                        {
                            issued_quantity: item.issued_quantity || 0,
                        },
                        {
                            where: { id: item.id },
                        }
                    )
                }
            }

            // Check if all items are issued
            const requisitionItems = await MaterialRequisitionItem.findAll({
                where: { requisition_id: id },
            })

            const totalRequested = requisitionItems.reduce((sum, item) => sum + Number(item.requested_quantity), 0)
            const totalIssued = requisitionItems.reduce((sum, item) => sum + Number(item.issued_quantity), 0)

            let status = 'approved'
            if (totalIssued === 0) {
                status = 'approved'
            } else if (totalIssued < totalRequested) {
                status = 'partially_issued'
            } else {
                status = 'issued'
            }

            await requisition.update({
                status: status as any,
                approved_by: req.user!.id,
            })
        } else {
            await requisition.update({
                status: 'rejected',
                approved_by: req.user!.id,
            })
        }

        const updatedRequisition = await MaterialRequisition.findByPk(id, {
            include: [
                {
                    model: MaterialRequisitionItem,
                    as: 'items',
                    include: [
                        {
                            model: Material,
                            as: 'material',
                        },
                    ],
                },
            ],
        })

        res.json({
            success: true,
            message: `Requisition ${action}d successfully`,
            data: updatedRequisition,
        })
    } catch (error) {
        next(error)
    }
}

// Cancel requisition
export const cancelRequisition = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params

        const requisition = await MaterialRequisition.findByPk(id)

        if (!requisition) {
            throw createError('Material requisition not found', 404)
        }

        if (requisition.status === 'issued' || requisition.status === 'approved') {
            throw createError('Cannot cancel issued/approved requisition', 400)
        }

        await requisition.update({ status: 'rejected' })

        res.json({
            success: true,
            message: 'Requisition cancelled successfully',
        })
    } catch (error) {
        next(error)
    }
}
