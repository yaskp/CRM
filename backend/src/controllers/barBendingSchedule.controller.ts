import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import '../models/index' // Import all models to ensure associations are loaded
import BarBendingSchedule from '../models/BarBendingSchedule'
import Project from '../models/Project'
import DrawingPanel from '../models/DrawingPanel'
import Drawing from '../models/Drawing'
import User from '../models/User'
import { createError } from '../middleware/errorHandler'
import { Op } from 'sequelize'

export const createBarBendingSchedule = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { project_id, panel_number, schedule_number, drawing_reference, steel_quantity_kg } = req.body

    if (!project_id) {
      throw createError('Project ID is required', 400)
    }

    const project = await Project.findByPk(project_id)
    if (!project) {
      throw createError('Project not found', 404)
    }

    const barBendingSchedule = await BarBendingSchedule.create({
      project_id,
      panel_number,
      schedule_number,
      drawing_reference,
      steel_quantity_kg: steel_quantity_kg || 0,
      status: 'draft',
      created_by: req.user!.id,
    })

    res.status(201).json({
      success: true,
      message: 'Bar Bending Schedule created successfully',
      barBendingSchedule,
    })
  } catch (error) {
    next(error)
  }
}

export const getBarBendingSchedules = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { project_id, status, page = 1, limit = 10 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const where: any = {}
    if (project_id) where.project_id = project_id
    if (status) where.status = status

    const { count, rows } = await BarBendingSchedule.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
      include: [
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
      barBendingSchedules: rows,
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

export const getBarBendingSchedule = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const barBendingSchedule = await BarBendingSchedule.findByPk(Number(id), {
      include: [
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

    if (!barBendingSchedule) {
      throw createError('Bar Bending Schedule not found', 404)
    }

    res.json({
      success: true,
      barBendingSchedule,
    })
  } catch (error) {
    next(error)
  }
}

export const updateBarBendingSchedule = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { panel_number, schedule_number, drawing_reference, steel_quantity_kg, status } = req.body

    const barBendingSchedule = await BarBendingSchedule.findByPk(Number(id))

    if (!barBendingSchedule) {
      throw createError('Bar Bending Schedule not found', 404)
    }

    await barBendingSchedule.update({
      panel_number,
      schedule_number,
      drawing_reference,
      steel_quantity_kg,
      status,
    })

    res.json({
      success: true,
      message: 'Bar Bending Schedule updated successfully',
      barBendingSchedule,
    })
  } catch (error) {
    next(error)
  }
}

export const getBarBendingSchedulesByProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params

    const barBendingSchedules = await BarBendingSchedule.findAll({
      where: { project_id: Number(projectId) },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'name', 'project_code'],
          required: false,
        },
      ],
      order: [['created_at', 'DESC']],
    })

    res.json({
      success: true,
      barBendingSchedules,
    })
  } catch (error) {
    next(error)
  }
}

export const getDrawingPanelsForProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params

    // First get all drawings for the project
    const drawings = await Drawing.findAll({
      where: { project_id: Number(projectId) },
      attributes: ['id'],
    })

    const drawingIds = drawings.map((d: any) => d.id)

    if (drawingIds.length === 0) {
      return res.json({
        success: true,
        panels: [],
      })
    }

    // Then get panels for those drawings
    const panels = await DrawingPanel.findAll({
      where: {
        drawing_id: {
          [Op.in]: drawingIds,
        },
      },
      include: [
        {
          model: Drawing,
          as: 'drawing',
          attributes: ['id', 'drawing_code'],
          required: false,
        },
      ],
    })

    res.json({
      success: true,
      panels: panels.map((panel: any) => ({
        id: panel.id,
        panel_identifier: panel.panel_identifier,
        panel_number: panel.panel_identifier, // Use panel_identifier as panel_number for display
        drawing_code: panel.drawing?.drawing_code,
      })),
    })
  } catch (error) {
    next(error)
  }
}

