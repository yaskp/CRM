import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import '../models/index' // Import all models to ensure associations are loaded
import StoreTransaction from '../models/StoreTransaction'
import StoreTransactionItem from '../models/StoreTransactionItem'
import Inventory from '../models/Inventory'
import Warehouse from '../models/Warehouse'
import Project from '../models/Project'
import User from '../models/User'
import Material from '../models/Material'
import { generateTransactionNumber } from '../utils/storeTransactionCodeGenerator'
import { createError } from '../middleware/errorHandler'
import { Op } from 'sequelize'
import { sequelize } from '../database/connection'

export const createGRN = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction()
  try {
    const {
      destination_type, // 'warehouse' | 'project'
      destination_id,
      warehouse_id, // legacy
      transaction_date,
      items,
      remarks,
      received_from_type,
      received_from_id,
      reference_number,
      po_id
    } = req.body

    // Determine Destination
    const finalDestType = destination_type || 'warehouse'
    const finalDestId = destination_id || warehouse_id

    if (!finalDestId || !items || items.length === 0) {
      throw createError('Destination and items are required', 400)
    }

    const transaction_number = await generateTransactionNumber('GRN')

    const grnData: any = {
      transaction_number,
      transaction_type: 'GRN',
      destination_type: finalDestType,
      transaction_date,
      status: 'draft',
      remarks,
      created_by: req.user!.id,
      received_from_type,
      received_from_id,
      reference_number,
      po_id: po_id || null
    }

    if (finalDestType === 'project') {
      grnData.to_project_id = finalDestId
      // Also set project_id as generic field if helpful, or specific to_project_id
      grnData.project_id = finalDestId
    } else {
      grnData.warehouse_id = finalDestId
    }

    const grn = await StoreTransaction.create(grnData, { transaction })

    // Create transaction items
    const transactionItems = await StoreTransactionItem.bulkCreate(
      items.map((item: any) => ({
        transaction_id: grn.id,
        material_id: item.material_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        batch_number: item.batch_number,
        expiry_date: item.expiry_date,
      })),
      { transaction }
    )

    await transaction.commit()

    res.status(201).json({
      success: true,
      message: 'GRN created successfully',
      grn: {
        ...grn.toJSON(),
        items: transactionItems,
      },
    })
  } catch (error) {
    if (transaction) await transaction.rollback()
    next(error)
  }
}

export const createSTN = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction()
  try {
    const {
      from_type,
      from_id,
      to_type,
      to_id,
      transaction_date,
      items,
      remarks,
      // Legacy support (optional)
      warehouse_id,
      to_warehouse_id
    } = req.body

    // Determine Source
    let finalFromType = from_type || 'warehouse'
    let finalFromId = from_id || warehouse_id

    // Determine Destination
    let finalToType = to_type || 'warehouse'
    let finalToId = to_id || to_warehouse_id

    if (!finalFromId || !finalToId || !items || items.length === 0) {
      throw createError('Source, Destination, and items are required', 400)
    }

    const transaction_number = await generateTransactionNumber('STN')

    // Construct Payload
    const stnData: any = {
      transaction_number,
      transaction_type: 'STN',
      source_type: finalFromType,
      destination_type: finalToType,
      transaction_date,
      status: 'draft',
      remarks,
      created_by: req.user!.id,
    }

    // Map Source ID
    if (finalFromType === 'warehouse') {
      stnData.warehouse_id = finalFromId
    } else if (finalFromType === 'project') {
      stnData.from_project_id = finalFromId
    }

    // Map Destination ID
    if (finalToType === 'warehouse') {
      stnData.to_warehouse_id = finalToId
    } else if (finalToType === 'project') {
      stnData.to_project_id = finalToId
    }

    const stn = await StoreTransaction.create(stnData, { transaction })

    // Create transaction items
    const transactionItems = await StoreTransactionItem.bulkCreate(
      items.map((item: any) => ({
        transaction_id: stn.id,
        material_id: item.material_id,
        quantity: item.quantity,
        batch_number: item.batch_number,
      })),
      { transaction }
    )

    await transaction.commit()

    res.status(201).json({
      success: true,
      message: 'STN created successfully',
      stn: {
        ...stn.toJSON(),
        items: transactionItems,
      },
    })
  } catch (error) {
    if (transaction) await transaction.rollback()
    next(error)
  }
}

export const createSRN = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      source_type,
      source_id,
      destination_type,
      destination_id,
      purchase_order_id,
      transaction_date,
      items,
      remarks,
      // Legacy params
      project_id,
      warehouse_id
    } = req.body

    // Default to Project->Warehouse if using legacy or defaults
    const finalSourceType = source_type || (project_id ? 'project' : 'project')
    const finalSourceId = source_id || project_id

    const finalDestType = destination_type || (warehouse_id ? 'warehouse' : 'warehouse')
    const finalDestId = destination_id || warehouse_id

    if (!finalSourceId || !finalDestId || !items || items.length === 0) {
      throw createError('Source, Destination, and items are required', 400)
    }

    const transaction_number = await generateTransactionNumber('SRN')

    const srnData: any = {
      transaction_number,
      transaction_type: 'SRN',
      source_type: finalSourceType,
      destination_type: finalDestType,
      transaction_date,
      status: 'draft',
      remarks,
      created_by: req.user!.id,
    }

    // Map Source
    if (finalSourceType === 'project') {
      srnData.from_project_id = finalSourceId
      // For legacy compatibility where 'project_id' was the generic field
      srnData.project_id = finalSourceId
    } else if (finalSourceType === 'warehouse') {
      srnData.warehouse_id = finalSourceId
    }

    // Map Destination
    if (finalDestType === 'warehouse') {
      // If source is project, this is usually 'warehouse_id' in old logic, 
      // but strictly it's a destination here. 
      // Let's use to_warehouse_id for clarity if source is project, 
      // but currently SRN approval uses 'warehouse_id' to increase stock?
      // Let's stick to consistent "Source -> Dest" field naming where possible
      // createSTN uses to_warehouse_id for destination. 
      // Let's use to_warehouse_id for SRN destination too.
      srnData.to_warehouse_id = finalDestId

      // Backwards compat: If Approval logic uses `warehouse_id` as "Place where stock changes", we must be careful.
      // In SRN (Site Return), stock INCREASES at warehouse.
      // In Purchase Return (Vendor Return), stock DECREASES at warehouse.
      // So 'warehouse_id' usually implies 'Inventory Owner'. 
      // In Site Return, Warehouse owns the resulting inventory.
      // In Purchase Return, Warehouse owns the source inventory.

      // I'll set BOTH if applicable to ensure legacy logic catches one? 
      // No, explicit is better. I will update approval logic to look at 'to_warehouse_id' for Site Returns.
    } else if (finalDestType === 'vendor') {
      srnData.vendor_id = finalDestId
      srnData.purchase_order_id = purchase_order_id
    }

    const srn = await StoreTransaction.create(srnData)

    // Create transaction items
    const transactionItems = await StoreTransactionItem.bulkCreate(
      items.map((item: any) => ({
        transaction_id: srn.id,
        material_id: item.material_id,
        quantity: item.quantity,
        batch_number: item.batch_number,
        remarks: item.remarks
      }))
    )

    res.status(201).json({
      success: true,
      message: 'SRN created successfully',
      srn: {
        ...srn.toJSON(),
        items: transactionItems,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getTransactions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { type, status, warehouse_id, page = 1, limit = 10 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const where: any = {}
    if (type) where.transaction_type = type
    if (status) where.status = status
    if (warehouse_id) where.warehouse_id = warehouse_id

    const { count, rows } = await StoreTransaction.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Warehouse,
          as: 'warehouse',
          attributes: ['id', 'name', 'code'],
          required: false,
        },
        {
          model: Warehouse,
          as: 'toWarehouse',
          attributes: ['id', 'name', 'code'],
          required: false,
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'project_code'],
          required: false,
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
      ],
    })

    res.json({
      success: true,
      transactions: rows,
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

export const getTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const transaction = await StoreTransaction.findByPk(Number(id), {
      include: [
        {
          model: Warehouse,
          as: 'warehouse',
          attributes: ['id', 'name', 'code'],
          required: false,
        },
        {
          model: Warehouse,
          as: 'toWarehouse',
          attributes: ['id', 'name', 'code'],
          required: false,
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'project_code'],
          required: false,
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
          required: false,
        },
        {
          model: StoreTransactionItem,
          as: 'items',
          required: false,
          include: [
            {
              model: Material,
              as: 'material',
              attributes: ['id', 'name', 'material_code', 'unit'],
              required: false,
            },
          ],
        },
      ],
    })

    if (!transaction) {
      throw createError('Transaction not found', 404)
    }

    res.json({
      success: true,
      transaction,
    })
  } catch (error) {
    next(error)
  }
}

export const approveTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction()
  try {
    const { id } = req.params

    const storeTransaction = await StoreTransaction.findByPk(Number(id), {
      include: [
        {
          model: StoreTransactionItem,
          as: 'items',
          required: false,
        },
      ],
      transaction,
    })

    if (!storeTransaction) {
      throw createError('Transaction not found', 404)
    }

    if (storeTransaction.status !== 'draft') {
      throw createError('Transaction already processed', 400)
    }

    // Get items if not loaded
    const items = (storeTransaction as any).items || await StoreTransactionItem.findAll({
      where: { transaction_id: storeTransaction.id },
      transaction,
    })

    // Update inventory based on transaction type
    if (storeTransaction.transaction_type === 'GRN') {
      // Increase inventory for GRN

      // Case 1: Receipt at Warehouse (Standard)
      if (storeTransaction.warehouse_id) {
        for (const item of items) {
          const existingInventory = await Inventory.findOne({
            where: {
              warehouse_id: storeTransaction.warehouse_id,
              material_id: item.material_id,
            },
            transaction,
          })

          if (existingInventory) {
            await existingInventory.update({
              quantity: sequelize.literal(`quantity + ${item.quantity}`),
            }, { transaction })
          } else {
            await Inventory.create({
              warehouse_id: storeTransaction.warehouse_id,
              material_id: item.material_id,
              quantity: item.quantity,
              reserved_quantity: 0
            }, { transaction })
          }
        }
      }
      // Case 2: Receipt at Project Site (Direct Delivery)
      else if (storeTransaction.to_project_id) {
        // Project inventory is calculated dynamically (Virtual), so no physical 'Inventory' record update needed here.
        // However, tracking this transaction as 'approved' is sufficient for the calculation logic.
      }
      else {
        throw createError('GRN must have a valid target warehouse or project', 400);
      }
    } else if (storeTransaction.transaction_type === 'STN') {
      // Decrease from source, increase in destination
      for (const item of items) {
        // Decrease from source warehouse ID ONLY if it exists (Warehouse Source)
        if (storeTransaction.warehouse_id) {
          const sourceInventory = await Inventory.findOne({
            where: {
              warehouse_id: storeTransaction.warehouse_id,
              material_id: item.material_id,
            },
            transaction,
          })

          if (sourceInventory) {
            await sourceInventory.update({
              quantity: sequelize.literal(`quantity - ${item.quantity}`),
            }, { transaction })
          }
        }

        // Increase in destination warehouse if defined
        if (storeTransaction.to_warehouse_id) {
          const destInventory = await Inventory.findOne({
            where: {
              warehouse_id: storeTransaction.to_warehouse_id,
              material_id: item.material_id,
            },
            transaction,
          })

          if (destInventory) {
            await destInventory.update({
              quantity: sequelize.literal(`quantity + ${item.quantity}`),
            }, { transaction })
          } else {
            await Inventory.create({
              warehouse_id: storeTransaction.to_warehouse_id,
              material_id: item.material_id,
              quantity: item.quantity,
              reserved_quantity: 0
            }, { transaction })
          }
        }
      }
    } else if (storeTransaction.transaction_type === 'SRN') {
      // SRN Logic: Handles both Site Returns (Project -> Warehouse) and Purchase Returns (Warehouse -> Vendor)
      for (const item of items) {
        // 1. Decrease from Source Warehouse (e.g. Purchase Return: Warehouse -> Vendor)
        if (storeTransaction.warehouse_id) {
          const sourceInventory = await Inventory.findOne({
            where: {
              warehouse_id: storeTransaction.warehouse_id,
              material_id: item.material_id,
            },
            transaction,
          })

          if (sourceInventory) {
            await sourceInventory.update({
              quantity: sequelize.literal(`quantity - ${item.quantity}`),
            }, { transaction })
          }
        }

        // 2. Increase in Destination Warehouse (e.g. Site Return: Project -> Warehouse)
        if (storeTransaction.to_warehouse_id) {
          const destInventory = await Inventory.findOne({
            where: {
              warehouse_id: storeTransaction.to_warehouse_id,
              material_id: item.material_id,
            },
            transaction,
          })

          if (destInventory) {
            await destInventory.update({
              quantity: sequelize.literal(`quantity + ${item.quantity}`),
            }, { transaction })
          } else {
            await Inventory.create({
              warehouse_id: storeTransaction.to_warehouse_id,
              material_id: item.material_id,
              quantity: item.quantity,
              reserved_quantity: 0
            }, { transaction })
          }
        }
      }
    }

    await storeTransaction.update({
      status: 'approved',
      approved_by: req.user!.id,
    }, { transaction })

    await transaction.commit()

    res.json({
      success: true,
      message: 'Transaction approved successfully',
      transaction: storeTransaction,
    })
  } catch (error) {
    if (transaction) await transaction.rollback()
    next(error)
  }
}

export const rejectTransaction = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { remarks } = req.body

    const storeTransaction = await StoreTransaction.findByPk(id)

    if (!storeTransaction) {
      throw createError('Transaction not found', 404)
    }

    await storeTransaction.update({
      status: 'rejected',
      approved_by: req.user!.id,
      remarks: remarks || storeTransaction.remarks,
    })

    res.json({
      success: true,
      message: 'Transaction rejected successfully',
      transaction: storeTransaction,
    })
  } catch (error) {
    next(error)
  }
}

