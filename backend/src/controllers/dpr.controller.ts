import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import DailyProgressReport from '../models/DailyProgressReport'
import ManpowerReport from '../models/ManpowerReport'
import WorkOrder from '../models/WorkOrder'
import DrawingPanel from '../models/DrawingPanel'
import DPRRmcLog from '../models/DPRRmcLog'
import { createError } from '../middleware/errorHandler'
import { Op } from 'sequelize'

export const createDPR = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      project_id,
      report_date,
      site_location,
      panel_number,
      building_id,
      floor_id,
      zone_id,
      work_item_type_id,
      guide_wall_running_meter,
      steel_quantity_kg,
      concrete_quantity_cubic_meter,
      polymer_consumption_bags,
      diesel_consumption_liters,
      weather_conditions,
      remarks,
      manpower,
      rmc_logs,
      // D-Wall Fields
      drawing_panel_id,
      actual_depth,
      verticality_x,
      verticality_y,
      slurry_density,
      slurry_viscosity,
      slurry_sand_content,
      cage_id_ref,
      start_time,
      end_time,
      slump_flow,
      tremie_pipe_count,
      theoretical_concrete_qty,
      overbreak_percentage
    } = req.body

    if (!project_id || !report_date) {
      throw createError('Project ID and report date are required', 400)
    }

    // 1. Enforce Work Order check
    const activeWO = await WorkOrder.findOne({
      where: {
        project_id,
        status: { [Op.in]: ['approved', 'active'] }
      }
    })

    if (!activeWO) {
      throw createError('Cannot start work or create DPR without an approved/active Work Order for this project.', 403)
    }

    // 2. Resolve panel link if panel_number is provided
    let final_panel_id = drawing_panel_id
    if (!final_panel_id && panel_number) {
      const panel = await DrawingPanel.findOne({
        where: { panel_identifier: panel_number },
        include: [{
          association: 'drawing',
          where: { project_id }
        }]
      })
      if (panel) final_panel_id = panel.id
    }

    const dpr = await DailyProgressReport.create({
      project_id,
      report_date,
      site_location,
      panel_number,
      drawing_panel_id: final_panel_id,
      building_id,
      floor_id,
      zone_id,
      work_item_type_id,
      guide_wall_running_meter,
      steel_quantity_kg,
      concrete_quantity_cubic_meter,
      polymer_consumption_bags,
      diesel_consumption_liters,
      weather_conditions,
      remarks,
      created_by: req.user!.id,

      // D-Wall Fields
      actual_depth,
      verticality_x,
      verticality_y,
      slurry_density,
      slurry_viscosity,
      slurry_sand_content,
      cage_id_ref,
      start_time,
      end_time,
      slump_flow,
      tremie_pipe_count,
      theoretical_concrete_qty,
      overbreak_percentage
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

    // Create RMC logs if provided
    if (rmc_logs && Array.isArray(rmc_logs)) {
      await DPRRmcLog.bulkCreate(
        rmc_logs.map((log: any) => ({
          dpr_id: dpr.id,
          vehicle_no: log.vehicle_no,
          quantity: log.quantity,
          slump: log.slump,
          in_time: log.in_time,
          start_time: log.start_time,
          out_time: log.out_time,
          remarks: log.remarks
        }))
      )
    }

    const dprWithManpower = await DailyProgressReport.findByPk(dpr.id, {
      include: [{ association: 'manpower' }, { association: 'rmcLogs' }],
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
        {
          association: 'workItemType',
          attributes: ['id', 'name'],
        },
        {
          association: 'building',
          attributes: ['id', 'name'],
        },
        {
          association: 'floor',
          attributes: ['id', 'name'],
        },
        {
          association: 'zone',
          attributes: ['id', 'name'],
        }
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
        {
          association: 'workItemType',
          attributes: ['id', 'name'],
        },
        {
          association: 'building',
          attributes: ['id', 'name'],
        },
        {
          association: 'floor',
          attributes: ['id', 'name'],
        },
        {
          association: 'zone',
          attributes: ['id', 'name'],
        }
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
      building_id,
      floor_id,
      zone_id,
      work_item_type_id,
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
      building_id,
      floor_id,
      zone_id,
      work_item_type_id,
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
          dpr_id: Number(id),
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
