import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import WorkOrder from '../models/WorkOrder'
import WorkOrderItem from '../models/WorkOrderItem'
import Project from '../models/Project'
import Client from '../models/Client'
import { generateWorkOrderNumber } from '../utils/workOrderCodeGenerator'
import { createError } from '../middleware/errorHandler'
import { generateWorkOrderPDF } from '../utils/pdfGenerator'

export const downloadWorkOrderPDF = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const wo = await WorkOrder.findByPk(id, {
      include: [
        { association: 'items' },
        { association: 'project' },
      ]
    })

    if (!wo) throw createError('Work order not found', 404)

    let woData: any = wo.toJSON();

    if (woData.vendor_id) {
      const { default: Vendor } = await import('../models/Vendor');
      const vendor = await Vendor.findByPk(woData.vendor_id);
      if (vendor) {
        woData.vendor = vendor.toJSON();
      }
    }

    const filename = `WorkOrder_${wo.work_order_number}.pdf`
    res.setHeader('Content-disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-type', 'application/pdf')

    generateWorkOrderPDF(woData, res)

  } catch (error) {
    next(error)
  }
}

export const createWorkOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      project_id, vendor_id, items, discount_percentage, payment_terms, po_wo_document_url,
      client_scope, contractor_scope, terms_conditions, remarks, status
    } = req.body

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
      item.amount = Number(item.quantity) * Number(item.rate)
      total_amount += item.amount
    })

    const discount = discount_percentage || 0
    const final_amount = total_amount - (total_amount * discount) / 100

    const workOrderStatus = status || 'draft'

    const workOrder = await WorkOrder.create({
      project_id,
      vendor_id,
      work_order_number,
      po_wo_document_url,
      total_amount,
      discount_percentage: discount,
      final_amount,
      payment_terms,
      client_scope,
      contractor_scope,
      terms_conditions,
      remarks,
      status: workOrderStatus,
    })

    // Create work order items with automatic category assignment
    const workOrderItems = await WorkOrderItem.bulkCreate(
      items.map((item: any) => ({
        work_order_id: workOrder.id,
        work_item_type_id: item.work_item_type_id,
        item_type: item.item_type || 'Other',
        category: item.item_type === 'material' ? 'material' : (item.category || 'labour'),
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate,
        amount: item.amount,
      }))
    )

    // AUTOMATION: Update Project Status based on Work Order Status (Standard CRM Workflow)
    if (workOrderStatus === 'approved') {
      await project.update({ status: 'mobilization' })
    } else if (workOrderStatus === 'active') {
      await project.update({ status: 'execution' })
    }

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
          include: [
            {
              model: Client,
              as: 'client',
              attributes: ['id', 'company_name']
            }
          ]
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
    const {
      vendor_id, items, discount_percentage, payment_terms, status,
      client_scope, contractor_scope, terms_conditions, remarks
    } = req.body

    const workOrder = await WorkOrder.findByPk(id, {
      include: [{ association: 'items' }],
    })

    if (!workOrder) {
      throw createError('Work order not found', 404)
    }

    // Track if status is changing for automation
    const oldStatus = workOrder.status
    const isStatusChanging = status && status !== oldStatus

    if (items && items.length > 0) {
      // Delete existing items
      await WorkOrderItem.destroy({ where: { work_order_id: id } })

      // Calculate new totals
      let total_amount = 0
      items.forEach((item: any) => {
        item.amount = Number(item.quantity) * Number(item.rate)
        total_amount += item.amount
      })

      const discount = discount_percentage !== undefined ? discount_percentage : workOrder.discount_percentage
      const final_amount = total_amount - (total_amount * discount) / 100

      // Create new items with automatic category assignment
      await WorkOrderItem.bulkCreate(
        items.map((item: any) => ({
          work_order_id: workOrder.id,
          work_item_type_id: item.work_item_type_id,
          item_type: item.item_type || 'Other',
          category: item.item_type === 'material' ? 'material' : (item.category || 'labour'),
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          rate: item.rate,
          amount: item.amount,
        }))
      )

      await workOrder.update({
        vendor_id: vendor_id !== undefined ? vendor_id : workOrder.vendor_id,
        total_amount,
        discount_percentage: discount,
        final_amount,
        payment_terms,
        client_scope,
        contractor_scope,
        terms_conditions,
        status,
      })
    } else {
      await workOrder.update({
        discount_percentage,
        payment_terms,
        client_scope,
        contractor_scope,
        terms_conditions,
        remarks,
        status,
      })
    }

    // AUTOMATION: Update Project Status based on Work Order Status Change (Standard CRM Workflow)
    if (isStatusChanging) {
      const project = await Project.findByPk(workOrder.project_id)
      if (project) {
        if (status === 'approved') {
          await project.update({ status: 'mobilization' })
        } else if (status === 'active') {
          await project.update({ status: 'execution' })
        } else if (status === 'completed') {
          await project.update({ status: 'completed' })
        }
      }
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
    const { work_item_type_id, item_type, description, quantity, unit, rate } = req.body

    const workOrder = await WorkOrder.findByPk(id)
    if (!workOrder) {
      throw createError('Work order not found', 404)
    }

    const amount = Number(quantity) * Number(rate)

    const item = await WorkOrderItem.create({
      work_order_id: Number(id),
      work_item_type_id,
      item_type: item_type || 'Other',
      description,
      quantity: Number(quantity),
      unit,
      rate: Number(rate),
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
