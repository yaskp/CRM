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
    const { warehouse_id, transaction_date, items, remarks } = req.body

    if (!warehouse_id || !items || items.length === 0) {
      throw createError('Warehouse ID and items are required', 400)
    }

    const transaction_number = await generateTransactionNumber('GRN')

    const grn = await StoreTransaction.create({
      transaction_number,
      transaction_type: 'GRN',
      warehouse_id,
      transaction_date,
      status: 'draft',
      remarks,
      created_by: req.user!.id,
    }, { transaction })

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
    await transaction.rollback()
    next(error)
  }
}

export const createSTN = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction()
  try {
    const { warehouse_id, to_warehouse_id, transaction_date, items, remarks } = req.body

    if (!warehouse_id || !to_warehouse_id || !items || items.length === 0) {
      throw createError('Warehouse IDs and items are required', 400)
    }

    const transaction_number = await generateTransactionNumber('STN')

    const stn = await StoreTransaction.create({
      transaction_number,
      transaction_type: 'STN',
      warehouse_id,
      to_warehouse_id,
      transaction_date,
      status: 'draft',
      remarks,
      created_by: req.user!.id,
    }, { transaction })

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
    await transaction.rollback()
    next(error)
  }
}

export const createSRN = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { warehouse_id, project_id, transaction_date, items, remarks } = req.body

    if (!warehouse_id || !project_id || !items || items.length === 0) {
      throw createError('Warehouse ID, Project ID and items are required', 400)
    }

    const transaction_number = await generateTransactionNumber('SRN')

    const srn = await StoreTransaction.create({
      transaction_number,
      transaction_type: 'SRN',
      warehouse_id,
      project_id,
      transaction_date,
      status: 'draft',
      remarks,
      created_by: req.user!.id,
    })

    // Create transaction items
    const transactionItems = await StoreTransactionItem.bulkCreate(
      items.map((item: any) => ({
        transaction_id: srn.id,
        material_id: item.material_id,
        quantity: item.quantity,
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
          }, { transaction })
        }
      }
    } else if (storeTransaction.transaction_type === 'STN') {
      // Decrease from source, increase in destination
      for (const item of items) {
        // Decrease from source warehouse
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

        // Increase in destination warehouse
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
            }, { transaction })
          }
        }
      }
    } else if (storeTransaction.transaction_type === 'SRN') {
      // Decrease inventory for SRN
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
            quantity: sequelize.literal(`quantity - ${item.quantity}`),
          }, { transaction })
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
    await transaction.rollback()
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

