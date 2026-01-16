import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import Warehouse from '../models/Warehouse'
import { createError } from '../middleware/errorHandler'
import { Op } from 'sequelize'

export const createWarehouse = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, code, address, company_id, is_common, warehouse_manager_id } = req.body

    if (!name || !code) {
      throw createError('Warehouse name and code are required', 400)
    }

    const warehouse = await Warehouse.create({
      name,
      code,
      address: address || req.body.location,
      company_id: company_id || req.user!.company_id,
      is_common: is_common || false,
      warehouse_manager_id,
    })

    res.status(201).json({
      success: true,
      message: 'Warehouse created successfully',
      warehouse,
    })
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(createError('Warehouse code already exists', 400))
    }
    next(error)
  }
}

export const getWarehouses = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const warehouses = await Warehouse.findAll({
      where: {
        [Op.or]: [
          { company_id: req.user?.company_id || null },
          { is_common: true },
        ],
      },
      include: [
        {
          association: 'company',
          attributes: ['id', 'name', 'code'],
        },
        {
          association: 'manager',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['name', 'ASC']],
    })

    res.json({
      success: true,
      warehouses,
    })
  } catch (error) {
    next(error)
  }
}

export const getWarehouse = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const warehouse = await Warehouse.findByPk(id, {
      include: [
        {
          association: 'company',
          attributes: ['id', 'name', 'code'],
        },
        {
          association: 'manager',
          attributes: ['id', 'name', 'email'],
        },
      ],
    })

    if (!warehouse) {
      throw createError('Warehouse not found', 404)
    }

    res.json({
      success: true,
      warehouse,
    })
  } catch (error) {
    next(error)
  }
}

export const updateWarehouse = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { name, address, warehouse_manager_id } = req.body

    const warehouse = await Warehouse.findByPk(id)
    if (!warehouse) {
      throw createError('Warehouse not found', 404)
    }

    await warehouse.update({
      name,
      address: address || req.body.location,
      warehouse_manager_id,
    })

    res.json({
      success: true,
      message: 'Warehouse updated successfully',
      warehouse,
    })
  } catch (error) {
    next(error)
  }
}

