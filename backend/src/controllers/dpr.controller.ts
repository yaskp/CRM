import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import DailyProgressReport from '../models/DailyProgressReport'
import ManpowerReport from '../models/ManpowerReport'
import { createError } from '../middleware/errorHandler'
import { Op } from 'sequelize'

export const createDPR = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      project_id,
      report_date,
      site_location,
      panel_number,
      guide_wall_running_meter,
      steel_quantity_kg,
      concrete_quantity_cubic_meter,
      polymer_consumption_bags,
      diesel_consumption_liters,
      weather_conditions,
      remarks,
      manpower,
    } = req.body

    if (!project_id || !report_date) {
      throw createError('Project ID and report date are required', 400)
    }

    const dpr = await DailyProgressReport.create({
      project_id,
      report_date,
      site_location,
      panel_number,
      guide_wall_running_meter,
      steel_quantity_kg,
      concrete_quantity_cubic_meter,
      polymer_consumption_bags,
      diesel_consumption_liters,
      weather_conditions,
      remarks,
      created_by: req.user!.id,
    })

    // Create manpower reports if provided
    if (manpower && Array.isArray(manpower)) {
      await ManpowerReport.bulkCreate(
        manpower.map((mp: any) => ({
          dpr_id: dpr.id,
          worker_type: mp.worker_type,
          count: mp.count,
          hajri: mp.hajri,
        }))
      )
    }

    const dprWithManpower = await DailyProgressReport.findByPk(dpr.id, {
      include: [{ association: 'manpower' }],
    })

    res.status(201).json({
      success: true,
      message: 'DPR created successfully',
      dpr: dprWithManpower,
    })
  } catch (error: any) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(createError('DPR already exists for this project, date, and panel', 400))
    }
    next(error)
  }
}

export const getDPRs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { project_id, start_date, end_date, page = 1, limit = 10 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const where: any = {}
    if (project_id) where.project_id = project_id
    if (start_date && end_date) {
      where.report_date = {
        [Op.between]: [start_date, end_date],
      }
    }

    const { count, rows } = await DailyProgressReport.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['report_date', 'DESC']],
      include: [
        {
          association: 'project',
          attributes: ['id', 'name', 'project_code'],
        },
        {
          association: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
    })

    res.json({
      success: true,
      dprs: rows,
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

export const getDPR = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const dpr = await DailyProgressReport.findByPk(id, {
      include: [
        {
          association: 'project',
          attributes: ['id', 'name', 'project_code'],
        },
        {
          association: 'creator',
          attributes: ['id', 'name', 'email'],
        },
        {
          association: 'manpower',
        },
      ],
    })

    if (!dpr) {
      throw createError('DPR not found', 404)
    }

    res.json({
      success: true,
      dpr,
    })
  } catch (error) {
    next(error)
  }
}

export const updateDPR = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const {
      report_date,
      site_location,
      panel_number,
      guide_wall_running_meter,
      steel_quantity_kg,
      concrete_quantity_cubic_meter,
      polymer_consumption_bags,
      diesel_consumption_liters,
      weather_conditions,
      remarks,
      manpower,
    } = req.body

    const dpr = await DailyProgressReport.findByPk(id)

    if (!dpr) {
      throw createError('DPR not found', 404)
    }

    await dpr.update({
      report_date,
      site_location,
      panel_number,
      guide_wall_running_meter,
      steel_quantity_kg,
      concrete_quantity_cubic_meter,
      polymer_consumption_bags,
      diesel_consumption_liters,
      weather_conditions,
      remarks,
    })

    // Update manpower if provided
    if (manpower && Array.isArray(manpower)) {
      await ManpowerReport.destroy({ where: { dpr_id: id } })
      await ManpowerReport.bulkCreate(
        manpower.map((mp: any) => ({
          dpr_id: id,
          worker_type: mp.worker_type,
          count: mp.count,
          hajri: mp.hajri,
        }))
      )
    }

    const updatedDPR = await DailyProgressReport.findByPk(id, {
      include: [{ association: 'manpower' }],
    })

    res.json({
      success: true,
      message: 'DPR updated successfully',
      dpr: updatedDPR,
    })
  } catch (error) {
    next(error)
  }
}

export const getDPRsByProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params

    const dprs = await DailyProgressReport.findAll({
      where: { project_id: projectId },
      order: [['report_date', 'DESC']],
      include: [
        {
          association: 'manpower',
        },
      ],
    })

    res.json({
      success: true,
      dprs,
    })
  } catch (error) {
    next(error)
  }
}

