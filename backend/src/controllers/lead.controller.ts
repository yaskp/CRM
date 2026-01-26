import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import Lead from '../models/Lead'
import Project from '../models/Project'
import Client from '../models/Client'
import { createError } from '../middleware/errorHandler'
import { Op } from 'sequelize'

export const createLead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      project_id,
      client_id,
      name,
      company_name,
      phone,
      email,
      address,
      source,
      enquiry_date,
      soil_report_url,
      layout_url,
      section_url,
      remarks,
      city,
      state,
      state_code
    } = req.body

    if (project_id) {
      const project = await Project.findByPk(project_id)
      if (!project) {
        throw createError('Project not found', 404)
      }
    }

    const lead = await Lead.create({
      project_id: project_id || null,
      client_id: client_id || null,
      name,
      company_name,
      phone,
      email,
      address,
      city,
      state,
      state_code,
      source,
      enquiry_date,
      soil_report_url,
      layout_url,
      section_url,
      remarks,
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
    const { project_id, status, search, page = 1, limit = 10 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const where: any = {}
    if (project_id === 'null') {
      where.project_id = { [Op.eq]: null }
    } else if (project_id) {
      where.project_id = project_id
    }
    // Also ensuring we list leads even if they have quotes, as long as they aren't converted to a project yet.
    // Maybe filter by status too? Usually 'converted' leads have a project.
    // If status != 'converted' and project_id is null.
    if (status) where.status = status
    else if (project_id === 'null') {
      // If asking for unassigned leads, we generally don't want 'converted' ones, though project_id=null implies not converted.
      // But just in case:
      where.status = { [Op.ne]: 'converted' }
    }
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { company_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone: { [Op.like]: `%${search}%` } },
      ]
    }

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
        {
          association: 'client',
          attributes: ['id', 'company_name', 'client_code', 'client_group_id', 'gstin', 'state'],
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
        {
          association: 'client',
          attributes: ['id', 'company_name', 'client_code', 'client_group_id', 'gstin', 'state'],
        },
        {
          association: 'quotations',
          attributes: ['id', 'quotation_number', 'final_amount', 'status', 'created_at']
        }
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
    const {
      name,
      client_id,
      company_name,
      phone,
      email,
      address,
      source,
      enquiry_date,
      soil_report_url,
      layout_url,
      section_url,
      remarks,
      city,
      state,
      state_code,
      status
    } = req.body

    const lead = await Lead.findByPk(id)
    if (!lead) {
      throw createError('Lead not found', 404)
    }

    await lead.update({
      name,
      client_id,
      company_name,
      phone,
      email,
      address,
      city,
      state,
      state_code,
      source,
      enquiry_date,
      soil_report_url,
      layout_url,
      section_url,
      remarks,
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

