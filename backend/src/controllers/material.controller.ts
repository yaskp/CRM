import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import Material from '../models/Material'
import { createError } from '../middleware/errorHandler'
import { Op } from 'sequelize'

export const createMaterial = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { material_code, name, category, unit, hsn_code, gst_rate } = req.body

    if (!material_code || !name || !unit) {
      throw createError('Material code, name, and unit are required', 400)
    }

    const material = await Material.create({
      material_code,
      name,
      category,
      unit,
      hsn_code,
      gst_rate,
      is_active: true,
    })

    res.status(201).json({
      success: true,
      message: 'Material created successfully',
      material,
    })
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(createError('Material code already exists', 400))
    }
    next(error)
  }
}

export const getMaterials = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search, category, page = 1, limit = 10 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const where: any = { is_active: true }
    if (category) where.category = category
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { material_code: { [Op.like]: `%${search}%` } },
      ]
    }

    const { count, rows } = await Material.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['name', 'ASC']],
    })

    res.json({
      success: true,
      materials: rows,
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

export const getMaterial = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const material = await Material.findByPk(id)
    if (!material) {
      throw createError('Material not found', 404)
    }

    res.json({
      success: true,
      material,
    })
  } catch (error) {
    next(error)
  }
}

export const updateMaterial = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { name, category, unit, hsn_code, gst_rate, is_active } = req.body

    const material = await Material.findByPk(id)
    if (!material) {
      throw createError('Material not found', 404)
    }

    await material.update({
      name,
      category,
      unit,
      hsn_code,
      gst_rate,
      is_active,
    })

    res.json({
      success: true,
      message: 'Material updated successfully',
      material,
    })
  } catch (error) {
    next(error)
  }
}

export const deleteMaterial = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const material = await Material.findByPk(id)
    if (!material) {
      throw createError('Material not found', 404)
    }

    await material.update({ is_active: false })

    res.json({
      success: true,
      message: 'Material deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

