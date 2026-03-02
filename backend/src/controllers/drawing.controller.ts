import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import Drawing from '../models/Drawing'
import DrawingPanel from '../models/DrawingPanel'
import PanelProgress from '../models/PanelProgress'
import DailyProgressReport from '../models/DailyProgressReport'
import StoreTransaction from '../models/StoreTransaction'
import StoreTransactionItem from '../models/StoreTransactionItem'
import BarBendingSchedule from '../models/BarBendingSchedule'
import DrawingPanelAnchor from '../models/DrawingPanelAnchor'
import DPRRmcLog from '../models/DPRRmcLog'
import { createError } from '../middleware/errorHandler'
import { sequelize } from '../database/connection'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const sanitizeNumber = (val: any): number | undefined => {
  if (val === undefined || val === null || val === '') return undefined
  const num = Number(val)
  return isNaN(num) ? undefined : num
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'drawings')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`)
  },
})

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.dwg', '.jpg', '.jpeg', '.png', '.dwg']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowedTypes.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, DWG, JPG, PNG'))
    }
  },
}).single('file')

export const uploadDrawing = async (req: AuthRequest, res: Response, next: NextFunction) => {
  upload(req as any, res, async (err) => {
    if (err) {
      return next(createError(err.message, 400))
    }

    try {
      const { project_id, drawing_number, drawing_name, drawing_type } = req.body
      const file = (req as any).file

      if (!project_id) {
        return next(createError('Project ID is required', 400))
      }

      const drawing = await Drawing.create({
        project_id,
        drawing_number,
        drawing_name: drawing_name || (file ? file.originalname : 'Panel Schedule'),
        drawing_type,
        file_url: file ? `/uploads/drawings/${file.filename}` : undefined,
        file_type: file ? path.extname(file.originalname).slice(1) : undefined,
        file_size: file ? file.size : undefined,
        uploaded_by: req.user!.id,
        version: 1,
        is_active: true,
      })

      res.status(201).json({
        success: true,
        message: 'Drawing uploaded successfully',
        drawing,
      })
    } catch (error) {
      next(error)
    }
  })
}

export const getDrawings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { project_id, drawing_type, page = 1, limit = 10 } = req.query
    const offset = (Number(page) - 1) * Number(limit)

    const where: any = { is_active: true }
    if (project_id) where.project_id = project_id
    if (drawing_type) where.drawing_type = drawing_type

    const { count, rows } = await Drawing.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['uploaded_at', 'DESC']],
      include: [
        {
          association: 'project',
          attributes: ['id', 'name', 'project_code'],
        },
        {
          association: 'uploader',
          attributes: ['id', 'name', 'email'],
        },
      ],
    })

    res.json({
      success: true,
      drawings: rows,
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

export const getDrawing = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const drawing = await Drawing.findByPk(id, {
      include: [
        {
          association: 'project',
          attributes: ['id', 'name', 'project_code'],
        },
        {
          association: 'uploader',
          attributes: ['id', 'name', 'email'],
        },
        {
          association: 'panels',
          include: [
            {
              association: 'dprRecords',
              order: [['report_date', 'DESC']],
              limit: 1,
            },
          ],
        },
      ],
    })

    if (!drawing) {
      throw createError('Drawing not found', 404)
    }

    res.json({
      success: true,
      drawing,
    })
  } catch (error) {
    next(error)
  }
}

export const markPanel = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let t: any;
  try {
    const { id } = req.params
    const {
      panel_identifier, coordinates_json, panel_type,
      length, width, design_depth, top_rl, bottom_rl,
      reinforcement_ton, no_of_anchors, anchor_length, anchor_capacity,
      concrete_design_qty, grabbing_qty, stop_end_area, guide_wall_rm, ramming_qty,
      anchors // Array of layer objects
    } = req.body

    t = await sequelize.transaction()

    if (!panel_identifier) {
      if (t) await t.rollback()
      throw createError('Panel identifier is required', 400)
    }

    const drawing = await Drawing.findByPk(id, { transaction: t })
    if (!drawing) {
      if (t) await t.rollback()
      throw createError('Drawing not found', 404)
    }

    const panel = await DrawingPanel.create({
      drawing_id: Number(id),
      panel_identifier,
      coordinates_json: JSON.stringify(coordinates_json),
      panel_type,
      length: sanitizeNumber(length),
      width: sanitizeNumber(width),
      design_depth: sanitizeNumber(design_depth),
      top_rl: sanitizeNumber(top_rl),
      bottom_rl: sanitizeNumber(bottom_rl),
      reinforcement_ton: sanitizeNumber(reinforcement_ton),
      no_of_anchors: sanitizeNumber(no_of_anchors),
      anchor_length: sanitizeNumber(anchor_length),
      anchor_capacity: sanitizeNumber(anchor_capacity),
      concrete_design_qty: sanitizeNumber(concrete_design_qty),
      grabbing_qty: sanitizeNumber(grabbing_qty),
      stop_end_area: sanitizeNumber(stop_end_area),
      guide_wall_rm: sanitizeNumber(guide_wall_rm),
      ramming_qty: sanitizeNumber(ramming_qty),
      created_by: req.user!.id,
    }, { transaction: t })

    // Create anchor layers if provided
    if (anchors && Array.isArray(anchors)) {
      await DrawingPanelAnchor.bulkCreate(
        anchors.map((layer: any, index: number) => ({
          drawing_panel_id: panel.id,
          layer_number: layer.layer_number || index + 1,
          no_of_anchors: sanitizeNumber(layer.no_of_anchors) || 0,
          anchor_length: sanitizeNumber(layer.anchor_length) || 0,
          anchor_capacity: sanitizeNumber(layer.anchor_capacity)
        })),
        { transaction: t }
      )
    }

    await t.commit()

    res.status(201).json({
      success: true,
      message: 'Panel marked successfully',
      panel,
    })
  } catch (error) {
    if (t) await t.rollback()
    next(error)
  }
}

export const bulkCreatePanels = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let t: any;
  try {
    const { id } = req.params // drawing_id
    const { panels } = req.body

    if (!panels || !Array.isArray(panels)) {
      throw createError('Panels array is required', 400)
    }

    t = await sequelize.transaction()

    const drawing = await Drawing.findByPk(id, { transaction: t })
    if (!drawing) {
      if (t) await t.rollback()
      throw createError('Drawing not found', 404)
    }

    const createdPanels = await DrawingPanel.bulkCreate(
      panels.map(p => ({
        drawing_id: Number(id),
        panel_identifier: p.panel_identifier,
        panel_type: p.panel_type || 'Primary',
        coordinates_json: JSON.stringify(p.dimensions || {}),
        length: sanitizeNumber(p.length) || sanitizeNumber(p.dimensions?.length),
        width: sanitizeNumber(p.width) || sanitizeNumber(p.dimensions?.width),
        design_depth: sanitizeNumber(p.design_depth) || sanitizeNumber(p.depth) || sanitizeNumber(p.dimensions?.depth),
        top_rl: sanitizeNumber(p.top_rl),
        bottom_rl: sanitizeNumber(p.bottom_rl),
        reinforcement_ton: sanitizeNumber(p.reinforcement_ton),
        no_of_anchors: sanitizeNumber(p.no_of_anchors),
        anchor_length: sanitizeNumber(p.anchor_length),
        anchor_capacity: sanitizeNumber(p.anchor_capacity),
        concrete_design_qty: sanitizeNumber(p.concrete_design_qty),
        grabbing_qty: sanitizeNumber(p.grabbing_qty),
        stop_end_area: sanitizeNumber(p.stop_end_area),
        guide_wall_rm: sanitizeNumber(p.guide_wall_rm),
        ramming_qty: sanitizeNumber(p.ramming_qty),
        created_by: req.user!.id
      })),
      { transaction: t }
    )

    // Create anchor layers for each panel if provided
    for (let i = 0; i < createdPanels.length; i++) {
      const panelData = panels[i]
      if (panelData.anchors && Array.isArray(panelData.anchors)) {
        await DrawingPanelAnchor.bulkCreate(
          panelData.anchors.map((layer: any, index: number) => ({
            drawing_panel_id: createdPanels[i].id,
            layer_number: layer.layer_number || index + 1,
            no_of_anchors: sanitizeNumber(layer.no_of_anchors) || 0,
            anchor_length: sanitizeNumber(layer.anchor_length) || 0,
            anchor_capacity: sanitizeNumber(layer.anchor_capacity)
          })),
          { transaction: t }
        )
      }
    }

    await t.commit()

    res.status(201).json({
      success: true,
      message: `${createdPanels.length} panels created successfully`,
      count: createdPanels.length
    })
  } catch (error) {
    if (t) await t.rollback()
    next(error)
  }
}

export const getPanels = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params

    const panels = await DrawingPanel.findAll({
      where: { drawing_id: id },
      include: [
        {
          association: 'anchors',
          required: false
        },
        {
          association: 'dprRecords',
          order: [['report_date', 'DESC']],
        },
        {
          association: 'consumptions', // The new StoreTransaction association
          where: { transaction_type: 'CONSUMPTION' },
          required: false,
          include: [
            { association: 'items' },
            { association: 'rmcLogs' }
          ], // Include items and RMC logs
          order: [['transaction_date', 'DESC']],
        }
      ],
    })

    res.json({
      success: true,
      panels,
    })
  } catch (error) {
    next(error)
  }
}

export const updatePanelProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { panelId } = req.params
    const { progress_date, progress_percentage, status, work_stage, remarks } = req.body

    const panel = await DrawingPanel.findByPk(panelId)
    if (!panel) {
      throw createError('Panel not found', 404)
    }

    const panelProgress = await PanelProgress.create({
      panel_id: Number(panelId),
      progress_date,
      progress_percentage,
      status: status || 'in_progress',
      work_stage,
      remarks,
      updated_by: req.user!.id,
    })

    res.json({
      success: true,
      message: 'Panel progress updated successfully',
      progress: panelProgress,
    })
  } catch (error) {
    next(error)
  }
}

export const updatePanel = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const t = await sequelize.transaction()
  try {
    const { panelId } = req.params
    const {
      panel_identifier, panel_type,
      length, width, design_depth, top_rl, bottom_rl,
      reinforcement_ton, no_of_anchors, anchor_length, anchor_capacity,
      concrete_design_qty, grabbing_qty, stop_end_area, guide_wall_rm, ramming_qty,
      anchors // Array of layer objects
    } = req.body

    const panel = await DrawingPanel.findByPk(panelId, {
      include: [
        { association: 'dprRecords', required: false },
        { association: 'consumptions', required: false },
        { association: 'drawing', include: [{ association: 'project' }] }
      ],
      transaction: t
    })
    if (!panel) {
      await t.rollback()
      throw createError('Panel not found', 404)
    }

    const oldIdentifier = panel.panel_identifier
    const projectId = (panel as any).drawing?.project_id

    // Safety check: block edits if DPR or consumption records exist
    const panelData = panel as any
    const hasDPR = panelData.dprRecords && panelData.dprRecords.length > 0
    const hasCons = panelData.consumptions && panelData.consumptions.length > 0

    // Admin/SuperAdmin can still edit
    const isAdmin = req.user?.roles?.some(r => ['Admin', 'SuperAdmin'].includes(r))

    if ((hasDPR || hasCons) && !isAdmin) {
      await t.rollback()
      throw createError('Cannot edit panel: DPR or material consumption records already exist for this panel.', 400)
    }

    // If identifier changed, update in related records
    if (panel_identifier && panel_identifier !== oldIdentifier) {
      // Update DPR
      await DailyProgressReport.update(
        { panel_number: panel_identifier },
        { where: { drawing_panel_id: panelId }, transaction: t }
      )

      // Update BBS by string match + project (since there's no FK)
      if (projectId) {
        await BarBendingSchedule.update(
          { panel_number: panel_identifier },
          { where: { panel_number: oldIdentifier, project_id: projectId }, transaction: t }
        )
      }
    }

    // Update coordinates_json to keep it in sync with top-level params
    let updatedCoordinatesJson = panel.coordinates_json;
    try {
      const existingDims = typeof panel.coordinates_json === 'string'
        ? JSON.parse(panel.coordinates_json)
        : (panel.coordinates_json || {});

      const newDims = { ...existingDims };
      if (length !== undefined) newDims.length = length;
      if (width !== undefined) newDims.width = width;
      if (design_depth !== undefined) {
        newDims.depth = design_depth;
        newDims.height = design_depth; // Keep height in sync for backward compatibility
      }

      updatedCoordinatesJson = JSON.stringify(newDims);
    } catch (e) { }

    await panel.update({
      panel_identifier,
      panel_type,
      length: sanitizeNumber(length),
      width: sanitizeNumber(width),
      design_depth: sanitizeNumber(design_depth),
      top_rl: sanitizeNumber(top_rl),
      bottom_rl: sanitizeNumber(bottom_rl),
      reinforcement_ton: sanitizeNumber(reinforcement_ton),
      no_of_anchors: sanitizeNumber(no_of_anchors),
      anchor_length: sanitizeNumber(anchor_length),
      anchor_capacity: sanitizeNumber(anchor_capacity),
      concrete_design_qty: sanitizeNumber(concrete_design_qty),
      grabbing_qty: sanitizeNumber(grabbing_qty),
      stop_end_area: sanitizeNumber(stop_end_area),
      guide_wall_rm: sanitizeNumber(guide_wall_rm),
      ramming_qty: sanitizeNumber(ramming_qty),
      coordinates_json: updatedCoordinatesJson
    }, { transaction: t })

    // Sync anchors
    if (anchors && Array.isArray(anchors)) {
      // Simplest way: delete existing and recreate
      await DrawingPanelAnchor.destroy({ where: { drawing_panel_id: panelId }, transaction: t })
      await DrawingPanelAnchor.bulkCreate(
        anchors.map((layer: any, index: number) => ({
          drawing_panel_id: Number(panelId),
          layer_number: layer.layer_number || index + 1,
          no_of_anchors: sanitizeNumber(layer.no_of_anchors) || 0,
          anchor_length: sanitizeNumber(layer.anchor_length) || 0,
          anchor_capacity: sanitizeNumber(layer.anchor_capacity)
        })),
        { transaction: t }
      )
    }

    await t.commit()
    res.json({
      success: true,
      message: 'Panel updated successfully',
      panel,
    })
  } catch (error) {
    await t.rollback()
    next(error)
  }
}

export const bulkUpdatePanels = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let t: any;
  try {
    const { panelIds, updates } = req.body
    if (!panelIds || !Array.isArray(panelIds) || panelIds.length === 0) {
      throw createError('panelIds array is required', 400)
    }

    t = await sequelize.transaction()

    const panels = await DrawingPanel.findAll({
      where: { id: panelIds },
      include: [
        { association: 'dprRecords', required: false },
        { association: 'consumptions', required: false }
      ],
      transaction: t
    })

    const isAdmin = req.user?.roles?.some(r => ['Admin', 'SuperAdmin'].includes(r))
    const blockedPanels: string[] = []

    if (!isAdmin) {
      for (const panel of panels) {
        const pd = panel as any
        if ((pd.dprRecords && pd.dprRecords.length > 0) || (pd.consumptions && pd.consumptions.length > 0)) {
          blockedPanels.push(pd.panel_identifier)
        }
      }
      if (blockedPanels.length > 0) {
        if (t) await t.rollback()
        throw createError(`Cannot bulk edit - panels with DPR/consumption records: ${blockedPanels.join(', ')}`, 400)
      }
    }

    const updatePayload: any = {}
    const allowedFields = [
      'panel_type', 'length', 'width', 'design_depth', 'top_rl', 'bottom_rl',
      'reinforcement_ton', 'no_of_anchors', 'anchor_length', 'anchor_capacity',
      'concrete_design_qty', 'grabbing_qty', 'stop_end_area', 'guide_wall_rm', 'ramming_qty'
    ]

    const numericFields = [
      'length', 'width', 'design_depth', 'top_rl', 'bottom_rl',
      'reinforcement_ton', 'no_of_anchors', 'anchor_length', 'anchor_capacity',
      'concrete_design_qty', 'grabbing_qty', 'stop_end_area', 'guide_wall_rm', 'ramming_qty'
    ]

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (numericFields.includes(field)) {
          updatePayload[field] = sanitizeNumber(updates[field])
        } else {
          updatePayload[field] = updates[field]
        }
      }
    }

    const hasNewAnchors = updates.anchors && Array.isArray(updates.anchors)

    if (Object.keys(updatePayload).length === 0 && !hasNewAnchors) {
      if (t) await t.rollback()
      throw createError('No valid fields to update', 400)
    }

    // Update each panel
    for (const panel of panels) {
      let updatedCoordinatesJson = panel.coordinates_json;
      if (updatePayload.length !== undefined || updatePayload.width !== undefined || updatePayload.design_depth !== undefined) {
        try {
          const dims = typeof panel.coordinates_json === 'string'
            ? JSON.parse(panel.coordinates_json)
            : (panel.coordinates_json || {});

          if (updatePayload.length !== undefined) dims.length = updatePayload.length;
          if (updatePayload.width !== undefined) dims.width = updatePayload.width;
          if (updatePayload.design_depth !== undefined) {
            dims.depth = updatePayload.design_depth;
            dims.height = updatePayload.design_depth;
          }
          updatedCoordinatesJson = JSON.stringify(dims);
        } catch (e) { }
      }

      await panel.update({
        ...updatePayload,
        coordinates_json: updatedCoordinatesJson
      }, { transaction: t })

      // Sync anchors if provided in bulk
      if (hasNewAnchors) {
        await DrawingPanelAnchor.destroy({ where: { drawing_panel_id: panel.id }, transaction: t })
        await DrawingPanelAnchor.bulkCreate(
          updates.anchors.map((layer: any, index: number) => ({
            drawing_panel_id: panel.id,
            layer_number: layer.layer_number || index + 1,
            no_of_anchors: sanitizeNumber(layer.no_of_anchors) || 0,
            anchor_length: sanitizeNumber(layer.anchor_length) || 0,
            anchor_capacity: sanitizeNumber(layer.anchor_capacity)
          })),
          { transaction: t }
        )
      }
    }

    await t.commit()
    res.json({ success: true, message: `${panels.length} panels updated successfully` })
  } catch (error) {
    if (t) await t.rollback()
    next(error)
  }
}
export const deletePanel = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const t = await sequelize.transaction()
  try {
    const { panelId } = req.params
    const panel = await DrawingPanel.findByPk(panelId, {
      include: [
        { association: 'dprRecords', required: false },
        { association: 'consumptions', required: false }
      ],
      transaction: t
    })
    if (!panel) {
      await t.rollback()
      throw createError('Panel not found', 404)
    }
    const isAdmin = req.user?.roles?.some(r => ['Admin', 'SuperAdmin'].includes(r))
    const pd = panel as any
    if ((pd.dprRecords && pd.dprRecords.length > 0) || (pd.consumptions && pd.consumptions.length > 0)) {
      if (!isAdmin) {
        await t.rollback()
        throw createError('Cannot delete panel: DPR or material consumption records already exist for this panel.', 400)
      }
    }

    // Remove references everywhere
    await DailyProgressReport.update({ drawing_panel_id: null as any }, { where: { drawing_panel_id: panelId }, transaction: t })
    await StoreTransaction.update({ drawing_panel_id: null as any }, { where: { drawing_panel_id: panelId }, transaction: t })
    await StoreTransactionItem.update({ drawing_panel_id: null as any }, { where: { drawing_panel_id: panelId }, transaction: t })
    await DPRRmcLog.update({ drawing_panel_id: null as any }, { where: { drawing_panel_id: panelId }, transaction: t })
    await DrawingPanelAnchor.destroy({ where: { drawing_panel_id: panelId }, transaction: t })
    await PanelProgress.destroy({ where: { panel_id: panelId }, transaction: t })

    await panel.destroy({ transaction: t })
    await t.commit()
    res.json({ success: true, message: 'Panel deleted successfully' })
  } catch (error) {
    await t.rollback()
    next(error)
  }
}

export const bulkDeletePanels = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const t = await sequelize.transaction()
  try {
    const { panelIds } = req.body
    if (!panelIds || !Array.isArray(panelIds) || panelIds.length === 0) {
      await t.rollback()
      throw createError('panelIds array is required', 400)
    }
    const panels = await DrawingPanel.findAll({
      where: { id: panelIds },
      include: [
        { association: 'dprRecords', required: false },
        { association: 'consumptions', required: false }
      ],
      transaction: t
    })

    const isAdmin = req.user?.roles?.some(r => ['Admin', 'SuperAdmin'].includes(r))
    const blockedPanels: string[] = []

    if (!isAdmin) {
      for (const panel of panels) {
        const pd = panel as any
        if ((pd.dprRecords && pd.dprRecords.length > 0) || (pd.consumptions && pd.consumptions.length > 0)) {
          blockedPanels.push(pd.panel_identifier)
        }
      }
      if (blockedPanels.length > 0) {
        await t.rollback()
        throw createError(`Cannot bulk delete - panels with DPR/consumption records: ${blockedPanels.join(', ')}`, 400)
      }
    }

    // Remove references everywhere
    await DailyProgressReport.update({ drawing_panel_id: null as any }, { where: { drawing_panel_id: panelIds }, transaction: t })
    await StoreTransaction.update({ drawing_panel_id: null as any }, { where: { drawing_panel_id: panelIds }, transaction: t })
    await StoreTransactionItem.update({ drawing_panel_id: null as any }, { where: { drawing_panel_id: panelIds }, transaction: t })
    await DPRRmcLog.update({ drawing_panel_id: null as any }, { where: { drawing_panel_id: panelIds }, transaction: t })
    await DrawingPanelAnchor.destroy({ where: { drawing_panel_id: panelIds }, transaction: t })
    await PanelProgress.destroy({ where: { panel_id: panelIds }, transaction: t })

    // Destroy all found panels
    await DrawingPanel.destroy({ where: { id: panelIds }, transaction: t })

    await t.commit()
    res.json({ success: true, message: `${panels.length} panels deleted successfully` })
  } catch (error) {
    await t.rollback()
    next(error)
  }
}