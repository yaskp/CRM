

import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import Project from '../models/Project'
import Lead from '../models/Lead'
import Client from '../models/Client'
import ClientGroup from '../models/ClientGroup'
import ClientContact from '../models/ClientContact'
import Quotation from '../models/Quotation'
import Warehouse from '../models/Warehouse'
import { generateProjectCode } from '../utils/projectCodeGenerator'
import { createError } from '../middleware/errorHandler'
import { Op } from 'sequelize'
import { sequelize } from '../database/connection'
import { getStateCodeFromGST } from '../utils/gstCalculator'
import ProjectDetails from '../models/ProjectDetails'
import ProjectBOQ from '../models/ProjectBOQ'
import ProjectBOQItem from '../models/ProjectBOQItem'
import QuotationItem from '../models/QuotationItem'

// Helper to generate client code if needed
const generateClientCode = async (): Promise<string> => {
  const year = new Date().getFullYear()
  const prefix = `CLT-${year}-`
  const lastClient = await Client.findOne({
    where: { client_code: { [Op.like]: `${prefix}%` } },
    order: [['created_at', 'DESC']]
  })
  let nextNumber = 1
  if (lastClient) {
    const lastNumber = parseInt(lastClient.client_code.split('-')[2])
    nextNumber = lastNumber + 1
  }
  return `${prefix}${String(nextNumber).padStart(3, '0')}`
}

export const createProjectFromQuotation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction()
  try {
    const { quotationId } = req.params
    // Allow overrides from body
    const {
      name,
      client_id: inputClientId,
      location,
      city,
      state,
      start_date,
      site_state_code
    } = req.body

    const quotation = await Quotation.findByPk(quotationId, {
      include: [
        {
          model: Lead,
          as: 'lead',
          include: [{ model: Client, as: 'client' }]
        }
      ],
      transaction
    })

    if (!quotation) {
      await transaction.rollback()
      throw createError('Quotation not found', 404)
    }

    if (!['approved', 'accepted_by_party'].includes(quotation.status)) {
      await transaction.rollback()
      throw createError('Quotation must be approved or accepted by party', 400)
    }

    // Check if project already created
    const lead = (quotation as any).lead as Lead
    if (lead.project_id) {
      const existingProject = await Project.findByPk(lead.project_id)
      if (existingProject) {
        await transaction.rollback()
        return res.json({
          success: true,
          message: 'Project already exists for this lead',
          project: existingProject
        })
      }
    }

    // CLIENT LOGIC
    // 1. If explicit client_id provided in body, use it.
    // 2. Else if Lead already has client_id, use it.
    // 3. Else search for EXISTING Client by Name/Email (Deduplication).
    // 4. Else create new Client from Lead details.
    // ... (Client Logic Resolution)
    let clientId = inputClientId || lead.client_id
    let finalClient: Client | null = null

    if (!clientId) {
      // Attempt to find existing client to prevent duplicates
      const existingClient = await Client.findOne({
        where: {
          [Op.or]: [
            lead.company_name ? { company_name: lead.company_name } : null,
            lead.email ? { email: lead.email } : null
          ].filter(Boolean) as any
        },
        transaction
      })

      if (existingClient) {
        clientId = existingClient.id
        finalClient = existingClient
      } else {
        // Find a default group if not provided (e.g., Corporate)
        let group = await ClientGroup.findOne({ where: { group_type: 'corporate' }, transaction })
        if (!group) group = await ClientGroup.findOne({ transaction })

        // Create New Client
        const clientCode = await generateClientCode()
        const newClient = await Client.create({
          client_code: clientCode,
          company_name: lead.company_name || lead.name,
          client_group_id: group?.id,
          contact_person: lead.name,
          email: lead.email,
          phone: lead.phone,
          address: lead.address,
          city: lead.city,
          state: lead.state,
          client_type: 'company',
          status: 'active'
        }, { transaction })

        // 🔗 Create Primary Contact linked to Client
        await ClientContact.create({
          client_id: newClient.id,
          contact_name: lead.name,
          email: lead.email,
          phone: lead.phone,
          is_primary: true,
          designation: 'Contact from Lead'
        }, { transaction })

        clientId = newClient.id
        finalClient = newClient
      }

      // Update Lead with the Client ID (new or existing)
      await lead.update({ client_id: clientId }, { transaction })
    } else {
      // Fetch existing client to get details
      finalClient = await Client.findByPk(clientId, { transaction })
      if (!finalClient && inputClientId) {
        // If inputClientId was bad, maybe throw error or just proceed? 
        // Proceeding but we won't have client details to copy.
      } else if (inputClientId && inputClientId !== lead.client_id) {
        await lead.update({ client_id: clientId }, { transaction })
      }
    }

    // Determine GST and Address to copy to Project
    const projectClientGstin = (finalClient?.gstin ?? undefined)
    const projectClientAddress = (finalClient?.address ?? (quotation as any).lead?.address ?? undefined)

    // Auto-derive site state code from GST if not provided
    let finalSiteStateCode = site_state_code
    if (!finalSiteStateCode && projectClientGstin) {
      finalSiteStateCode = getStateCodeFromGST(projectClientGstin)
    }


    // Create Project
    const projectCode = await generateProjectCode()
    const project = await Project.create({
      project_code: projectCode,
      name: name || (lead.name ? `${lead.name} Project` : `Project for Quote ${quotation.quotation_number}`),

      // Client Identity (Normalization fallback)
      client_id: clientId,
      client_name: finalClient?.company_name || lead.company_name || 'Unknown Client',
      client_contact_person: finalClient?.contact_person || lead.name,
      client_email: finalClient?.email || lead.email,
      client_phone: finalClient?.phone || lead.phone,
      client_address: finalClient?.address || lead.address,
      client_gst_number: finalClient?.gstin,
      client_pan_number: finalClient?.pan || undefined,

      // Site Details
      site_location: location || lead.address,
      site_address: lead.address,
      site_city: city || lead.city,
      site_state: state || lead.state,
      site_state_code: finalSiteStateCode,

      // Duplication for compatibility
      client_gstin: projectClientGstin,
      client_ho_address: projectClientAddress,

      contract_value: quotation.final_amount,
      start_date: start_date || new Date(),
      status: 'confirmed',
      created_by: req.user!.id,
      company_id: req.user!.company_id,
    }, { transaction })

    // Initialize Extended Project Details
    await ProjectDetails.create({
      project_id: project.id,
      site_address: lead.address,
      contract_value: quotation.final_amount,
      start_date: start_date || new Date(),
      payment_terms: quotation.payment_terms || undefined,
      remarks: `Converted from Quotation: ${quotation.quotation_number}`
    }, { transaction })

    // Link Lead to Project
    await lead.update({ project_id: project.id, status: 'converted' }, { transaction })

    // Create Site Warehouse
    const warehouseCode = `WH-${projectCode}`
    await Warehouse.create({
      name: `Site - ${project.name}`,
      code: warehouseCode,
      type: 'site',
      company_id: req.user!.company_id,
      is_common: false,
      project_id: project.id
    }, { transaction })

    // LINK QUOTATION TO PROJECT
    await quotation.update({ project_id: project.id }, { transaction })

    // AUTO-INITIALIZE BILL OF QUANTITIES (BOQ)
    const boq = await ProjectBOQ.create({
      project_id: project.id,
      title: `Bill of Quantities (BOQ) - Synced from Quote ${quotation.quotation_number}`,
      version: 1,
      status: 'approved', // Auto-approved as it matches the contract
      created_by: req.user!.id,
      total_estimated_amount: quotation.total_amount
    }, { transaction })

    // Pull material items from quotation to populate BOQ
    const quotationItems = await QuotationItem.findAll({
      where: { quotation_id: quotation.id, item_type: 'material' },
      transaction
    })

    if (quotationItems.length > 0) {
      const boqItems = quotationItems
        .filter(qi => !!qi.reference_id) // Only materials with valid master link
        .map(qi => ({
          boq_id: boq.id,
          material_id: qi.reference_id!,
          quantity: qi.quantity,
          unit: qi.unit,
          estimated_rate: qi.rate,
          remarks: `Synced from Quotation Item: ${qi.description}`
        }))

      if (boqItems.length > 0) {
        await ProjectBOQItem.bulkCreate(boqItems, { transaction })
      }
    }

    await transaction.commit()

    res.status(201).json({
      success: true,
      message: 'Project created successfully from quotation',
      project
    })

  } catch (error) {
    if (transaction) await transaction.rollback()
    return next(error)
  }
}

export const createProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // ... (keeping createProject same for now, though it should ideally accept client_id)
  try {
    const {
      name, location, city, state, client_ho_address, company_id,
      client_gstin, site_state_code, rera_number, start_date, end_date, contract_value,
      lead_id, client_id
    } = req.body

    if (!name) {
      throw createError('Project name is required', 400)
    }

    const projectCode = await generateProjectCode()

    // Fetch Client for Sync (Normalization fallback)
    let syncClient = null
    if (client_id) {
      syncClient = await Client.findByPk(client_id)
    }

    // Auto-extract site state code from client GST if site_state_code not provided
    let finalSiteStateCode = site_state_code
    if (!finalSiteStateCode && (client_gstin || syncClient?.gstin)) {
      finalSiteStateCode = getStateCodeFromGST(client_gstin || syncClient?.gstin!)
    }

    const project = await Project.create({
      project_code: projectCode,
      name,

      // Client Identity Sync
      client_id,
      client_name: syncClient?.company_name || 'Unknown Client',
      client_contact_person: syncClient?.contact_person,
      client_email: syncClient?.email,
      client_phone: syncClient?.phone,
      client_address: syncClient?.address,
      client_gst_number: syncClient?.gstin || client_gstin,
      client_pan_number: syncClient?.pan,

      // Site details
      site_location: location,
      site_address: location, // duplicating to both for compatibility
      site_city: city,
      site_state: state,
      site_state_code: finalSiteStateCode,

      client_ho_address,
      client_gstin,
      rera_number,
      start_date,
      expected_end_date: end_date,
      contract_value,
      status: 'lead',
      created_by: req.user!.id,
      company_id: company_id || req.user!.company_id,
    })

    // Initialize Extended Project Details
    await ProjectDetails.create({
      project_id: project.id,
      site_address: location,
      contract_value,
      start_date,
      expected_end_date: end_date,
      remarks: 'Project created manually'
    })

    // If created from a Lead, link them and update lead status
    if (lead_id) {
      const lead = await Lead.findByPk(lead_id)
      if (lead) {
        await lead.update({
          project_id: project.id,
          status: 'converted'
        })
      }
    }

    // Create Site Warehouse
    const warehouseCode = `WH-${projectCode}`
    await Warehouse.create({
      name: `Site - ${project.name}`,
      code: warehouseCode,
      type: 'site',
      company_id: company_id || req.user!.company_id,
      is_common: false,
      project_id: project.id
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

    const isAdmin = req.user!.roles?.includes('Admin')
    if (req.user!.company_id && !isAdmin) {
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
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'company_name', 'client_code'],
          include: [
            {
              model: ClientGroup,
              as: 'group',
              attributes: ['id', 'group_name', 'group_type']
            }
          ]
        }
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
          association: 'leads',
          attributes: ['id', 'status', 'soil_report_url', 'layout_url', 'section_url', 'created_at']
        },
        {
          association: 'company',
          attributes: ['id', 'name', 'code'],
        },
        {
          association: 'documents',
        },
        {
          model: Client,
          as: 'client',
          include: [
            {
              model: ClientGroup,
              as: 'group'
            },
            {
              model: ClientContact,
              as: 'contacts'
            }
          ]
        },
        {
          association: 'buildings',
          include: [
            {
              association: 'floors',
              include: [{ association: 'zones' }]
            }
          ]
        }
      ],
    })

    if (!project) {
      throw createError('Project not found', 404)
    }

    const projectJSON = project.toJSON()
    // specific lead_id property for frontend compatibility
    // if multiple leads, take the first one (usually 1-1 in conversion flow)
    if (project.leads && project.leads.length > 0) {
      (projectJSON as any).lead_id = project.leads[0].id;
    }

    res.json({
      success: true,
      project: projectJSON,
    })
  } catch (error) {
    next(error)
  }
}

export const updateProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const {
      name, location, city, state, client_ho_address, status,
      client_gstin, site_state_code, rera_number, start_date, end_date, contract_value,
      client_id, lead_id
    } = req.body

    const project = await Project.findByPk(id)

    if (!project) {
      throw createError('Project not found', 404)
    }

    // Auto-extract site state code from client GST if site_state_code not provided
    let finalSiteStateCode = site_state_code
    if (!finalSiteStateCode && client_gstin) {
      finalSiteStateCode = getStateCodeFromGST(client_gstin)
    }

    // Fetch Client for Sync if changed
    let syncClientFields: any = {}
    if (client_id) {
      const syncClient = await Client.findByPk(client_id)
      if (syncClient) {
        syncClientFields = {
          client_name: syncClient.company_name,
          client_contact_person: syncClient.contact_person,
          client_email: syncClient.email,
          client_phone: syncClient.phone,
          client_address: syncClient.address,
          client_gst_number: syncClient.gstin,
          client_pan_number: syncClient.pan,
        }
      }
    }

    await project.update({
      name,
      site_location: location,
      site_city: city,
      site_state: state,
      client_ho_address,
      status,
      client_gstin,
      site_state_code: finalSiteStateCode,
      rera_number,
      start_date,
      expected_end_date: end_date,
      contract_value,
      client_id,
      ...syncClientFields
    })

    if (lead_id) {
      const lead = await Lead.findByPk(lead_id)
      if (lead) {
        await lead.update({ project_id: project.id, status: 'converted' })
      }
    }

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

    const validStatuses = ['lead', 'quotation', 'confirmed', 'design', 'mobilization', 'execution', 'completed', 'on_hold', 'cancelled']
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

