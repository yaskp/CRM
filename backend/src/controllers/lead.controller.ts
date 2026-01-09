import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import Lead from '../models/Lead'
import Project from '../models/Project'
import { createError } from '../middleware/errorHandler'

export const createLead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { project_id, source, enquiry_date, soil_report_url, layout_url, section_url } = req.body

    if (!project_id) {
      throw createError('Project ID is required', 400)
    }

    const project = await Project.findByPk(project_id)
    if (!project) {
      throw createError('Project not found', 404)
    }

    const lead = await Lead.create({
      project_id,
      source,
      enquiry_date,
      soil_report_url,
      layout_url,
      section_url,
      status: 'new',
    })

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      lead,
    })
  } catch (error) {
    next(error)
  }
}

export const getLeads = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { project_id, status, page = 1, limit = 10 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const where: any = {}
    if (project_id) where.project_id = project_id
    if (status) where.status = status

    const { count, rows } = await Lead.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          association: 'project',
          attributes: ['id', 'name', 'project_code'],
        },
      ],
    })

    res.json({
      success: true,
      leads: rows,
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

export const getLead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const lead = await Lead.findByPk(id, {
      include: [
        {
          association: 'project',
          attributes: ['id', 'name', 'project_code'],
        },
      ],
    })

    if (!lead) {
      throw createError('Lead not found', 404)
    }

    res.json({
      success: true,
      lead,
    })
  } catch (error) {
    next(error)
  }
}

export const updateLead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const { source, enquiry_date, soil_report_url, layout_url, section_url, status } = req.body

    const lead = await Lead.findByPk(id)
    if (!lead) {
      throw createError('Lead not found', 404)
    }

    await lead.update({
      source,
      enquiry_date,
      soil_report_url,
      layout_url,
      section_url,
      status,
    })

    res.json({
      success: true,
      message: 'Lead updated successfully',
      lead,
    })
  } catch (error) {
    next(error)
  }
}

export const convertLeadToProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const lead = await Lead.findByPk(id, {
      include: [{ association: 'project' }],
    })

    if (!lead) {
      throw createError('Lead not found', 404)
    }

    await lead.update({ status: 'converted' })
    await lead.project.update({ status: 'confirmed' })

    res.json({
      success: true,
      message: 'Lead converted to project successfully',
      lead,
    })
  } catch (error) {
    next(error)
  }
}

