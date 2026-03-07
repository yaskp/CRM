import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import Quotation from '../models/Quotation'
import QuotationItem from '../models/QuotationItem'
import Lead from '../models/Lead'
import Project from '../models/Project'
import Client from '../models/Client'
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
      gst_type,
      cgst_amount,
      sgst_amount,
      igst_amount,
      payment_terms,
      valid_until,
      annexure_id,
      billing_unit_id,
      client_scope,
      contractor_scope,
      terms_conditions,
      scope_matrix,
      items,
      source_id
    } = req.body

    if (!lead_id || !total_amount) {
      throw createError('Lead ID and total amount are required', 400)
    }

    const lead = await Lead.findByPk(lead_id, {
      include: [{ model: Client, as: 'client' }]
    })
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
      const discount = Number(discount_percentage || 0)
      const amountAfterDiscount = Number(total_amount) - (Number(total_amount) * discount) / 100

      // Calculate final amount with taxes if not explicitly provided
      let final_cgst = Number(cgst_amount || 0)
      let final_sgst = Number(sgst_amount || 0)
      let final_igst = Number(igst_amount || 0)
      let final_gst_type = gst_type

      // Optional: Auto-detect GST if possible and not provided
      if (!final_gst_type && lead.client?.gstin) {
        // Assuming company state is '27' (Maharashtra) for now as default, 
        // or we can fetch company state from companies table. 
        // Let's assume a default for now or stick to provided values if available.
        // For ERP robustness, we should fetch Company details.
      }

      const final_amount = amountAfterDiscount + final_cgst + final_sgst + final_igst

      const quotation = await Quotation.create({
        lead_id,
        version_number,
        quotation_number,
        billing_unit_id,
        total_amount,
        discount_percentage: discount,
        gst_type: final_gst_type,
        cgst_amount: final_cgst,
        sgst_amount: final_sgst,
        igst_amount: final_igst,
        final_amount,
        payment_terms,
        valid_until,
        annexure_id,
        client_scope,
        contractor_scope,
        terms_conditions,
        scope_matrix,
        status: 'draft',
        created_by: req.user!.id,
      }, { transaction: t })

      if (items && Array.isArray(items)) {
        const quotationItems = items.map((item: any) => ({
          ...item,
          quotation_id: quotation.id,
          work_item_type_id: item.work_item_type_id,
          parent_work_item_type_id: item.parent_work_item_type_id
        }))
        await QuotationItem.bulkCreate(quotationItems, { transaction: t })
      }

      if (source_id) {
        await Quotation.update(
          { status: 'superseded' },
          { where: { id: source_id }, transaction: t }
        )
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
    const { lead_id, project_id, status, search, page = 1, limit = 10 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const where: any = {}
    if (lead_id) where.lead_id = lead_id
    if (project_id) where.project_id = project_id
    if (status) where.status = status

    if (search) {
      where[Op.or] = [
        { quotation_number: { [Op.like]: `%${search}%` } },
        { '$lead.name$': { [Op.like]: `%${search}%` } },
        { '$lead.company_name$': { [Op.like]: `%${search}%` } },
        { '$project.name$': { [Op.like]: `%${search}%` } }
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
          association: 'project',
          attributes: ['id', 'name', 'project_code'],
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
          include: [
            { association: 'workItemType', attributes: ['id', 'name', 'code'] },
            { association: 'parentWorkItemType', attributes: ['id', 'name', 'code'] }
          ]
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
        {
          association: 'annexure',
        }
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
      gst_type,
      cgst_amount,
      sgst_amount,
      igst_amount,
      payment_terms,
      valid_until,
      annexure_id,
      client_scope,
      contractor_scope,
      terms_conditions,
      status,
      items,
      billing_unit_id,
      scope_matrix
    } = req.body

    const quotation = await Quotation.findByPk(id)
    if (!quotation) {
      throw createError('Quotation not found', 404)
    }

    await sequelize.transaction(async (t) => {
      const discount = discount_percentage !== undefined ? Number(discount_percentage) : Number(quotation.discount_percentage)
      const total = total_amount !== undefined ? Number(total_amount) : Number(quotation.total_amount)
      const baseAmount = total - (total * discount) / 100

      const final_cgst = cgst_amount !== undefined ? Number(cgst_amount) : Number(quotation.cgst_amount || 0)
      const final_sgst = sgst_amount !== undefined ? Number(sgst_amount) : Number(quotation.sgst_amount || 0)
      const final_igst = igst_amount !== undefined ? Number(igst_amount) : Number(quotation.igst_amount || 0)

      const final_amount = baseAmount + final_cgst + final_sgst + final_igst

      await quotation.update({
        billing_unit_id,
        total_amount: total,
        discount_percentage: discount,
        gst_type,
        cgst_amount: final_cgst,
        sgst_amount: final_sgst,
        igst_amount: final_igst,
        final_amount,
        payment_terms,
        valid_until,
        annexure_id,
        client_scope,
        contractor_scope,
        terms_conditions,
        scope_matrix,
        status,
      }, { transaction: t })

      // AUTOMATION: Update Lead and Project status based on Quotation Status
      if (status) { // Only if status is being updated
        const lead = await Lead.findByPk(quotation.lead_id, { transaction: t })

        if (lead) {
          if (status === 'sent') {
            await lead.update({ status: 'quoted' }, { transaction: t })
            if (lead.project_id) {
              await Project.update({ status: 'quotation' }, { where: { id: lead.project_id }, transaction: t })
            }
          } else if (['accepted', 'accepted_by_party', 'approved'].includes(status)) {
            // Note: In standard CRM, 'converted' usually happens at the Project Creation stage, 
            // but we mark it here as 'WON/READY' for conversion.
            await lead.update({ status: 'converted' }, { transaction: t })

            if (lead.project_id) {
              await Project.update({ status: 'confirmed' }, { where: { id: lead.project_id }, transaction: t })
            }
          }
        }
      }

      if (items && Array.isArray(items)) {
        // Simple strategy: Delete all existing items and recreate
        await QuotationItem.destroy({ where: { quotation_id: id }, transaction: t })

        const quotationItems = items.map((item: any) => ({
          ...item,
          quotation_id: id,
          work_item_type_id: item.work_item_type_id,
          parent_work_item_type_id: item.parent_work_item_type_id
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
          attributes: ['name', 'company_name', 'address', 'city', 'state', 'pincode', 'phone', 'email'],
        },
        {
          association: 'items',
        },
        {
          association: 'annexure',
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
export const reviseQuotation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction()
  try {
    const { id } = req.params

    // 1. Fetch original quotation with all items
    const original = await Quotation.findByPk(id, {
      include: [{ association: 'items' }],
      transaction
    })

    if (!original) {
      await transaction.rollback()
      throw createError('Original quotation not found', 404)
    }

    // 2. Determine new version number (latest + 1)
    const latest = await Quotation.findOne({
      where: { lead_id: original.lead_id },
      order: [['version_number', 'DESC']],
      transaction
    })
    const nextVersion = (latest?.version_number || original.version_number) + 1

    // 3. Prepare unique quotation number for this version
    // Standard: QT-101 becomes QT-101-R2, then QT-101-R3, etc.
    const baseNumber = original.quotation_number.split('-R')[0]
    const newQuotationNumber = `${baseNumber}-R${nextVersion}`

    // 4. Create new quotation clone
    const revision = await Quotation.create({
      lead_id: original.lead_id,
      quotation_number: newQuotationNumber,
      version_number: nextVersion,
      billing_unit_id: original.billing_unit_id,
      total_amount: original.total_amount,
      discount_percentage: original.discount_percentage,
      gst_type: original.gst_type,
      cgst_amount: original.cgst_amount,
      sgst_amount: original.sgst_amount,
      igst_amount: original.igst_amount,
      final_amount: original.final_amount,
      payment_terms: original.payment_terms,
      valid_until: original.valid_until,
      annexure_id: original.annexure_id,
      client_scope: original.client_scope,
      contractor_scope: original.contractor_scope,
      terms_conditions: original.terms_conditions,
      scope_matrix: original.scope_matrix,
      status: 'draft', // Revision starts as draft
      created_by: req.user!.id,
    }, { transaction })

    // 4. Mark the original as superseded
    await original.update({ status: 'superseded' }, { transaction })

    // 5. Clone line items
    if (original.items && original.items.length > 0) {
      const newItems = original.items.map((item: any) => ({
        quotation_id: revision.id,
        item_type: item.item_type,
        reference_id: item.reference_id,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        rate: item.rate,
        amount: item.amount,
        work_item_type_id: item.work_item_type_id,
        parent_work_item_type_id: item.parent_work_item_type_id
      }))
      await QuotationItem.bulkCreate(newItems, { transaction })
    }

    await transaction.commit()

    res.status(201).json({
      success: true,
      message: `Quotation revised to version ${nextVersion}`,
      quotation: revision
    })

  } catch (error) {
    if (transaction) await transaction.rollback()
    next(error)
  }
}
