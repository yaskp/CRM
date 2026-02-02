import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import WorkOrder from '../models/WorkOrder'
import WorkOrderItem from '../models/WorkOrderItem'
import Project from '../models/Project'
import Client from '../models/Client'
import ProjectDocument from '../models/ProjectDocument'
import { generateWorkOrderNumber } from '../utils/workOrderCodeGenerator'
import { createError } from '../middleware/errorHandler'
import { generateWorkOrderPDF } from '../utils/pdfGenerator'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import PaymentAllocation from '../models/PaymentAllocation'

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
    const { project_id, status, vendor_id, page = 1, limit = 10 } = req.query

    const offset = (Number(page) - 1) * Number(limit)

    const where: any = {}
    if (project_id) where.project_id = project_id
    if (status) where.status = status
    if (vendor_id) where.vendor_id = vendor_id

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
        { model: PaymentAllocation, as: 'paymentAllocations', attributes: ['allocated_amount'] }
      ],
    })

    const workOrdersWithPayments = rows.map(wo => {
      const allocations = (wo as any).paymentAllocations || []
      const settled_amount = allocations.reduce((sum: number, a: any) =>
        sum + Number(a.allocated_amount || 0) + Number(a.tds_allocated || 0) + Number(a.retention_allocated || 0), 0)
      return {
        ...wo.toJSON(),
        paid_amount: settled_amount,
        balance_amount: Number(wo.final_amount) - settled_amount
      }
    })

    res.json({
      success: true,
      workOrders: workOrdersWithPayments,
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
          include: [
            {
              model: Client,
              as: 'client',
              attributes: ['id', 'company_name', 'client_code']
            }
          ]
        },
        {
          association: 'vendor',
          attributes: ['id', 'name', 'vendor_type']
        },
        {
          association: 'items',
        },
        { model: PaymentAllocation, as: 'paymentAllocations' }
      ],
    })

    if (!workOrder) {
      throw createError('Work order not found', 404)
    }

    const allocations = (workOrder as any).paymentAllocations || []
    const settled_amount = allocations.reduce((sum: number, a: any) =>
      sum + Number(a.allocated_amount || 0) + Number(a.tds_allocated || 0) + Number(a.retention_allocated || 0), 0)

    res.json({
      success: true,
      workOrder: {
        ...workOrder.toJSON(),
        paid_amount: settled_amount,
        balance_amount: Number(workOrder.final_amount) - settled_amount
      },
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

// Configure multer for signed work order uploads
const signedWOUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      const tempDir = path.join(process.cwd(), 'uploads', 'temp')
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })
      cb(null, tempDir)
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname)
      cb(null, `temp-wo-${Date.now()}${ext}`)
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}).single('file')

export const uploadSignedWorkOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  signedWOUpload(req as any, res, async (err: any) => {
    if (err) return next(createError(err.message, 400))

    try {
      const { id } = req.params
      const file = (req as any).file
      if (!file) throw createError('No file uploaded', 400)

      const workOrder = await WorkOrder.findByPk(id, {
        include: [
          {
            association: 'project',
            include: [{ association: 'client' }]
          }
        ]
      })

      if (!workOrder) throw createError('Work order not found', 404)

      const project = (workOrder as any).project
      const client = project?.client
      const clientCode = client?.client_code || 'external'
      const projectCode = project?.project_code || 'general'
      const woNumber = workOrder.work_order_number.replace(/\//g, '_')

      // Define target directory
      const targetSubDir = path.join('clients', clientCode, 'projects', projectCode, 'work_orders')
      const targetDir = path.join(process.cwd(), 'uploads', targetSubDir)

      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true })

      // Define final filename
      const ext = path.extname(file.originalname)
      const finalFileName = `Signed_WO_${woNumber}_${Date.now()}${ext}`
      const finalPath = path.join(targetDir, finalFileName)

      // Move file from temp to final destination
      fs.renameSync(file.path, finalPath)

      const publicUrl = `/uploads/${targetSubDir.replace(/\\/g, '/')}/${finalFileName}`

      // Update work order
      await workOrder.update({ po_wo_document_url: publicUrl })

      // Create ProjectDocument entry for organized tracking
      await ProjectDocument.create({
        project_id: workOrder.project_id,
        document_type: 'work_order',
        document_name: `Signed Work Order - ${workOrder.work_order_number}`,
        file_path: publicUrl,
        file_type: ext.slice(1),
        file_size: file.size,
        uploaded_by: req.user!.id,
        description: `Signed copy for Work Order ${workOrder.work_order_number}`
      })

      res.json({
        success: true,
        message: 'Signed work order uploaded and archived successfully',
        url: publicUrl
      })
    } catch (error) {
      if ((req as any).file && fs.existsSync((req as any).file.path)) {
        fs.unlinkSync((req as any).file.path)
      }
      next(error)
    }
  })
}
