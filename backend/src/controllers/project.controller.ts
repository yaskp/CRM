import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import Project from '../models/Project'
import { generateProjectCode } from '../utils/projectCodeGenerator'
import { createError } from '../middleware/errorHandler'
import { Op } from 'sequelize'

export const createProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name, location, city, state, client_ho_address, company_id } = req.body

    if (!name) {
      throw createError('Project name is required', 400)
    }

    const projectCode = await generateProjectCode()

    const project = await Project.create({
      project_code: projectCode,
      name,
      location,
      city,
      state,
      client_ho_address,
      status: 'lead',
      created_by: req.user!.id,
      company_id: company_id || req.user!.company_id,
    })

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      project,
    })
  } catch (error) {
    next(error)
  }
}

export const getProjects = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { project_code: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } },
      ]
    }

    // Filter by company if user has company_id
    if (req.user!.company_id) {
      where.company_id = req.user!.company_id
    }

    const { count, rows } = await Project.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          association: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
    })

    res.json({
      success: true,
      projects: rows,
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

export const getProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const project = await Project.findByPk(id, {
      include: [
        {
          association: 'creator',
          attributes: ['id', 'name', 'email'],
        },
        {
          association: 'company',
          attributes: ['id', 'name', 'code'],
        },
      ],
    })

    if (!project) {
      throw createError('Project not found', 404)
    }

    res.json({
      success: true,
      project,
    })
  } catch (error) {
    next(error)
  }
}

export const updateProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { name, location, city, state, client_ho_address, status } = req.body

    const project = await Project.findByPk(id)

    if (!project) {
      throw createError('Project not found', 404)
    }

    await project.update({
      name,
      location,
      city,
      state,
      client_ho_address,
      status,
    })

    res.json({
      success: true,
      message: 'Project updated successfully',
      project,
    })
  } catch (error) {
    next(error)
  }
}

export const deleteProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const project = await Project.findByPk(id)

    if (!project) {
      throw createError('Project not found', 404)
    }

    await project.destroy()

    res.json({
      success: true,
      message: 'Project deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

export const updateProjectStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { status } = req.body

    const validStatuses = ['lead', 'quotation', 'confirmed', 'design', 'mobilization', 'execution', 'completed', 'on_hold']
    if (!validStatuses.includes(status)) {
      throw createError('Invalid status', 400)
    }

    const project = await Project.findByPk(id)

    if (!project) {
      throw createError('Project not found', 404)
    }

    await project.update({ status })

    res.json({
      success: true,
      message: 'Project status updated successfully',
      project,
    })
  } catch (error) {
    next(error)
  }
}

