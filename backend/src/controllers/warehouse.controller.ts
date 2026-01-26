import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import Warehouse from '../models/Warehouse'
import { createError } from '../middleware/errorHandler'
import { Op } from 'sequelize'

export const createWarehouse = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, code, type, address, company_id, is_common, warehouse_manager_id, project_id, city, state, state_code, pincode, gstin, incharge_name, incharge_phone } = req.body

    if (!name || !code) {
      throw createError('Warehouse name and code are required', 400)
    }

    const warehouse = await Warehouse.create({
      name,
      code,
      type: type || 'central',
      address,
      company_id: company_id || req.user!.company_id,
      is_common: is_common || false,
      warehouse_manager_id,
      project_id,
      city,
      state,
      state_code,
      pincode,
      gstin,
      incharge_name,
      incharge_phone
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
          ...(req.user?.company_id ? [{ company_id: req.user.company_id }] : []),
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
        {
          association: 'project',
          attributes: ['id', 'name'],
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
        {
          association: 'project',
          attributes: ['id', 'name'],
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
    const { name, type, address, is_common, warehouse_manager_id, project_id, city, state, state_code, pincode, gstin, incharge_name, incharge_phone } = req.body

    const warehouse = await Warehouse.findByPk(id)
    if (!warehouse) {
      throw createError('Warehouse not found', 404)
    }

    await warehouse.update({
      name,
      type,
      address,
      is_common,
      warehouse_manager_id,
      project_id,
      city,
      state,
      state_code,
      pincode,
      gstin,
      incharge_name,
      incharge_phone
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

