import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import Quotation from '../models/Quotation'
import QuotationItem from '../models/QuotationItem'
import Lead from '../models/Lead'
import Project from '../models/Project'
import { sequelize } from '../database/connection'
import { generateQuotationNumber } from '../utils/quotationCodeGenerator'
import { createError } from '../middleware/errorHandler'
import { generateQuotationPDF } from '../utils/pdfGenerator'
import { Op } from 'sequelize'

export const createQuotation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      lead_id,
      total_amount,
      discount_percentage,
      payment_terms,
      valid_until,
      items
    } = req.body

    if (!lead_id || !total_amount) {
      throw createError('Lead ID and total amount are required', 400)
    }

    const lead = await Lead.findByPk(lead_id)
    if (!lead) {
      throw createError('Lead not found', 404)
    }

    const result = await sequelize.transaction(async (t) => {
      // Get latest version number for this lead
      const latestQuotation = await Quotation.findOne({
        where: { lead_id },
        order: [['version_number', 'DESC']],
        transaction: t,
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
      }, { transaction: t })

      if (items && Array.isArray(items)) {
        const quotationItems = items.map((item: any) => ({
          ...item,
          quotation_id: quotation.id
        }))
        await QuotationItem.bulkCreate(quotationItems, { transaction: t })
      }

      // AUTOMATION: Update Lead and Project status
      // When a quotation is created, we consider the lead as 'quoted'
      await Lead.update(
        { status: 'quoted' },
        { where: { id: lead_id }, transaction: t }
      )

      if (lead.project_id) {
        await Project.update(
          { status: 'quotation' },
          { where: { id: lead.project_id }, transaction: t }
        )
      }

      return quotation
    })

    const quotationWithItems = await Quotation.findByPk(result.id, {
      include: [{ association: 'items' }]
    })

    res.status(201).json({
      success: true,
      message: 'Quotation created successfully',
      quotation: quotationWithItems,
    })
  } catch (error) {
    next(error)
  }
}

export const getQuotations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { lead_id, status, search, page = 1, limit = 10 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const where: any = {}
    if (lead_id) where.lead_id = lead_id
    if (status) where.status = status

    if (search) {
      where[Op.or] = [
        { quotation_number: { [Op.like]: `%${search}%` } },
        { '$lead.name$': { [Op.like]: `%${search}%` } },
        { '$lead.company_name$': { [Op.like]: `%${search}%` } }
      ]
    }

    const { count, rows } = await Quotation.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['created_at', 'DESC']],
      include: [
        {
          association: 'lead',
          attributes: ['id', 'name', 'company_name', 'project_id'],
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
      subQuery: false, // Required for searching in associated models with limit/offset
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
          association: 'items',
        },
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
      items
    } = req.body

    const quotation = await Quotation.findByPk(id)
    if (!quotation) {
      throw createError('Quotation not found', 404)
    }

    await sequelize.transaction(async (t) => {
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
      }, { transaction: t })

      // AUTOMATION: Update Lead and Project status based on Quotation Status
      if (status) { // Only if status is being updated
        const lead = await Lead.findByPk(quotation.lead_id, { transaction: t })

        if (lead) {
          if (status === 'sent') {
            await lead.update({ status: 'quoted' }, { transaction: t })

            if (lead.project_id) {
              await Project.update(
                { status: 'quotation' },
                { where: { id: lead.project_id }, transaction: t }
              )
            }
          } else if (status === 'accepted') {
            await lead.update({ status: 'converted' }, { transaction: t })

            if (lead.project_id) {
              await Project.update(
                { status: 'confirmed' },
                { where: { id: lead.project_id }, transaction: t }
              )
            }
          }
        }
      }

      if (items && Array.isArray(items)) {
        // Simple strategy: Delete all existing items and recreate
        await QuotationItem.destroy({ where: { quotation_id: id }, transaction: t })

        const quotationItems = items.map((item: any) => ({
          ...item,
          quotation_id: id
        }))
        await QuotationItem.bulkCreate(quotationItems, { transaction: t })
      }
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

export const downloadPdf = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const quotation = await Quotation.findByPk(id, {
      include: [
        {
          association: 'lead',
          attributes: ['name', 'company_name', 'address', 'phone', 'email'],
        },
      ],
    })

    if (!quotation) {
      throw createError('Quotation not found', 404)
    }

    const filename = `Quotation-${quotation.quotation_number}.pdf`

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    generateQuotationPDF(quotation, res)

  } catch (error) {
    next(error)
  }
}
