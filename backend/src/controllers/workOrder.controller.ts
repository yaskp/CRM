import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import WorkOrder from '../models/WorkOrder'
import WorkOrderItem from '../models/WorkOrderItem'
import Project from '../models/Project'
import { generateWorkOrderNumber } from '../utils/workOrderCodeGenerator'
import { createError } from '../middleware/errorHandler'
import { Sequelize } from 'sequelize'

export const createWorkOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { project_id, items, discount_percentage, payment_terms, po_wo_document_url } = req.body

    if (!project_id || !items || items.length === 0) {
      throw createError('Project ID and items are required', 400)
    }

    const project = await Project.findByPk(project_id)
    if (!project) {
      throw createError('Project not found', 404)
    }

    const work_order_number = await generateWorkOrderNumber()

    // Calculate total amount from items
    let total_amount = 0
    items.forEach((item: any) => {
      item.amount = item.quantity * item.rate
      total_amount += item.amount
    })

    const discount = discount_percentage || 0
    const final_amount = total_amount - (total_amount * discount) / 100

    const workOrder = await WorkOrder.create({
      project_id,
      work_order_number,
      po_wo_document_url,
      total_amount,
      discount_percentage: discount,
      final_amount,
      payment_terms,
      status: 'draft',
    })

    // Create work order items
    const workOrderItems = await WorkOrderItem.bulkCreate(
      items.map((item: any) => ({
        work_order_id: workOrder.id,
        item_type: item.item_type,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate,
        amount: item.amount,
      }))
    )

    res.status(201).json({
      success: true,
      message: 'Work order created successfully',
      workOrder: {
        ...workOrder.toJSON(),
        items: workOrderItems,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getWorkOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { project_id, status, page = 1, limit = 10 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const where: any = {}
    if (project_id) where.project_id = project_id
    if (status) where.status = status

    const { count, rows } = await WorkOrder.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          association: 'project',
          attributes: ['id', 'name', 'project_code'],
        },
      ],
    })

    res.json({
      success: true,
      workOrders: rows,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(count / Number(limit)),
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getWorkOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const workOrder = await WorkOrder.findByPk(id, {
      include: [
        {
          association: 'project',
          attributes: ['id', 'name', 'project_code'],
        },
        {
          association: 'items',
        },
      ],
    })

    if (!workOrder) {
      throw createError('Work order not found', 404)
    }

    res.json({
      success: true,
      workOrder,
    })
  } catch (error) {
    next(error)
  }
}

export const updateWorkOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { items, discount_percentage, payment_terms, status } = req.body

    const workOrder = await WorkOrder.findByPk(id, {
      include: [{ association: 'items' }],
    })

    if (!workOrder) {
      throw createError('Work order not found', 404)
    }

    if (items && items.length > 0) {
      // Delete existing items
      await WorkOrderItem.destroy({ where: { work_order_id: id } })

      // Calculate new totals
      let total_amount = 0
      items.forEach((item: any) => {
        item.amount = item.quantity * item.rate
        total_amount += item.amount
      })

      const discount = discount_percentage !== undefined ? discount_percentage : workOrder.discount_percentage
      const final_amount = total_amount - (total_amount * discount) / 100

      // Create new items
      await WorkOrderItem.bulkCreate(
        items.map((item: any) => ({
          work_order_id: workOrder.id,
          item_type: item.item_type,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          amount: item.amount,
        }))
      )

      await workOrder.update({
        total_amount,
        discount_percentage: discount,
        final_amount,
        payment_terms,
        status,
      })
    } else {
      await workOrder.update({
        discount_percentage,
        payment_terms,
        status,
      })
    }

    const updatedWO = await WorkOrder.findByPk(id, {
      include: [{ association: 'items' }],
    })

    res.json({
      success: true,
      message: 'Work order updated successfully',
      workOrder: updatedWO,
    })
  } catch (error) {
    next(error)
  }
}

export const addWorkOrderItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { item_type, description, quantity, unit, rate } = req.body

    const workOrder = await WorkOrder.findByPk(id)
    if (!workOrder) {
      throw createError('Work order not found', 404)
    }

    const amount = quantity * rate

    const item = await WorkOrderItem.create({
      work_order_id: id,
      item_type,
      description,
      quantity,
      unit,
      rate,
      amount,
    })

    // Recalculate totals
    const items = await WorkOrderItem.findAll({ where: { work_order_id: id } })
    const total_amount = items.reduce((sum, item) => sum + Number(item.amount), 0)
    const discount = workOrder.discount_percentage || 0
    const final_amount = total_amount - (total_amount * discount) / 100

    await workOrder.update({ total_amount, final_amount })

    res.json({
      success: true,
      message: 'Item added successfully',
      item,
    })
  } catch (error) {
    next(error)
  }
}

export const deleteWorkOrderItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id, itemId } = req.params

    const item = await WorkOrderItem.findByPk(itemId)
    if (!item || item.work_order_id !== Number(id)) {
      throw createError('Item not found', 404)
    }

    await item.destroy()

    // Recalculate totals
    const workOrder = await WorkOrder.findByPk(id)
    if (workOrder) {
      const items = await WorkOrderItem.findAll({ where: { work_order_id: id } })
      const total_amount = items.reduce((sum, item) => sum + Number(item.amount), 0)
      const discount = workOrder.discount_percentage || 0
      const final_amount = total_amount - (total_amount * discount) / 100

      await workOrder.update({ total_amount, final_amount })
    }

    res.json({
      success: true,
      message: 'Item deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

