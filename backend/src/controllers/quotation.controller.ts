import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import Quotation from '../models/Quotation'
import Lead from '../models/Lead'
import { generateQuotationNumber } from '../utils/quotationCodeGenerator'
import { createError } from '../middleware/errorHandler'
import { Op } from 'sequelize'

export const createQuotation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      lead_id,
      total_amount,
      discount_percentage,
      payment_terms,
      valid_until,
    } = req.body

    if (!lead_id || !total_amount) {
      throw createError('Lead ID and total amount are required', 400)
    }

    const lead = await Lead.findByPk(lead_id)
    if (!lead) {
      throw createError('Lead not found', 404)
    }

    // Get latest version number for this lead
    const latestQuotation = await Quotation.findOne({
      where: { lead_id },
      order: [['version_number', 'DESC']],
    })

    const version_number = latestQuotation ? latestQuotation.version_number + 1 : 1

    const quotation_number = await generateQuotationNumber()
    const discount = discount_percentage || 0
    const final_amount = total_amount - (total_amount * discount) / 100

    const quotation = await Quotation.create({
      lead_id,
      version_number,
      quotation_number,
      total_amount,
      discount_percentage: discount,
      final_amount,
      payment_terms,
      valid_until,
      status: 'draft',
      created_by: req.user!.id,
    })

    res.status(201).json({
      success: true,
      message: 'Quotation created successfully',
      quotation,
    })
  } catch (error) {
    next(error)
  }
}

export const getQuotations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { lead_id, status, page = 1, limit = 10 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const where: any = {}
    if (lead_id) where.lead_id = lead_id
    if (status) where.status = status

    const { count, rows } = await Quotation.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          association: 'lead',
          include: [
            {
              association: 'project',
              attributes: ['id', 'name', 'project_code'],
            },
          ],
        },
        {
          association: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
    })

    res.json({
      success: true,
      quotations: rows,
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

export const getQuotation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const quotation = await Quotation.findByPk(id, {
      include: [
        {
          association: 'lead',
          include: [
            {
              association: 'project',
              attributes: ['id', 'name', 'project_code'],
            },
          ],
        },
        {
          association: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
    })

    if (!quotation) {
      throw createError('Quotation not found', 404)
    }

    res.json({
      success: true,
      quotation,
    })
  } catch (error) {
    next(error)
  }
}

export const updateQuotation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const {
      total_amount,
      discount_percentage,
      payment_terms,
      valid_until,
      status,
    } = req.body

    const quotation = await Quotation.findByPk(id)
    if (!quotation) {
      throw createError('Quotation not found', 404)
    }

    const discount = discount_percentage !== undefined ? discount_percentage : quotation.discount_percentage
    const total = total_amount !== undefined ? total_amount : quotation.total_amount
    const final_amount = total - (total * discount) / 100

    await quotation.update({
      total_amount: total,
      discount_percentage: discount,
      final_amount,
      payment_terms,
      valid_until,
      status,
    })

    res.json({
      success: true,
      message: 'Quotation updated successfully',
      quotation,
    })
  } catch (error) {
    next(error)
  }
}

export const getQuotationsByLead = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { leadId } = req.params

    const quotations = await Quotation.findAll({
      where: { lead_id: leadId },
      order: [['version_number', 'ASC']],
      include: [
        {
          association: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
    })

    res.json({
      success: true,
      quotations,
    })
  } catch (error) {
    next(error)
  }
}

