import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import Material from '../models/Material'
import { createError } from '../middleware/errorHandler'
import { Op } from 'sequelize'
import { sequelize } from '../database/connection'

export const createMaterial = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { code, material_code, name, category, unit, hsn_code, gst_rate, standard_rate, uom } = req.body

    // Allow 'code' alias for 'material_code'
    const finalMaterialCode = material_code || code

    if (!finalMaterialCode || !name || !unit) {
      throw createError('Material code, name, and unit are required', 400)
    }

    const material = await Material.create({
      material_code: finalMaterialCode,
      name,
      category,
      unit,
      hsn_code,
      gst_rate,
      standard_rate,
      uom,
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
    const { search, category, page, limit } = req.query
    const parsedLimit = limit ? Number(limit) : undefined
    const parsedPage = page ? Number(page) : 1
    const offset = parsedLimit ? (parsedPage - 1) * parsedLimit : undefined

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
      limit: parsedLimit,
      offset: offset,
      order: [['name', 'ASC']],
    })

    const totalMaterials = await Material.count()
    const activeMaterials = await Material.count({ where: { is_active: true } })
    const uniqueCategories = await Material.count({ distinct: true, col: 'category' })

    const stats = {
      total: totalMaterials,
      active: activeMaterials,
      inactive: totalMaterials - activeMaterials,
      categories: uniqueCategories
    }

    res.json({
      success: true,
      materials: rows,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(count / Number(limit)),
      },
      stats
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
    const { name, category, unit, hsn_code, gst_rate, is_active, standard_rate, uom } = req.body

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
      standard_rate,
      uom,
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

export const importMaterials = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction();
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      throw createError('No items provided for import', 400);
    }

    const results = {
      success: [] as any[],
      errors: [] as any[],
      duplicates: [] as any[]
    };

    for (const item of items) {
      try {
        let { material_code, name, category, unit, hsn_code, gst_rate, standard_rate, uom } = item;

        if (!material_code || !name || !unit || !uom) {
          results.errors.push({
            item,
            error: 'Material code, name, unit, and base uom (uom) are required'
          });
          continue;
        }

        // Handle multiple units if provided as comma separated string
        if (typeof unit === 'string') {
          unit = unit.split(',').map(u => u.trim());
        }

        // Check for duplicates in database
        const existing = await Material.findOne({
          where: { material_code },
          transaction
        });

        if (existing) {
          results.duplicates.push({
            item,
            error: `Material code ${material_code} already exists`
          });
          continue;
        }

        const material = await Material.create({
          material_code,
          name,
          category,
          unit,
          hsn_code,
          gst_rate: gst_rate || 0,
          standard_rate: standard_rate || 0,
          uom,
          is_active: true
        }, { transaction });

        results.success.push(material);
      } catch (error: any) {
        results.errors.push({
          item,
          error: error.message || 'Internal error'
        });
      }
    }

    await transaction.commit();

    res.json({
      success: true,
      message: `Import completed: ${results.success.length} imported, ${results.duplicates.length} duplicates skipped, ${results.errors.length} errors`,
      data: results
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
}

