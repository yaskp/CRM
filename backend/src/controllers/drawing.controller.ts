import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import Drawing from '../models/Drawing'
import DrawingPanel from '../models/DrawingPanel'
import PanelProgress from '../models/PanelProgress'
import { createError } from '../middleware/errorHandler'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

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
  try {
    const { id } = req.params
    const {
      panel_identifier, coordinates_json, panel_type,
      length, width, design_depth, top_rl, bottom_rl,
      reinforcement_ton, no_of_anchors, anchor_length, anchor_capacity,
      concrete_design_qty, grabbing_qty, stop_end_area, guide_wall_rm, ramming_qty
    } = req.body

    if (!panel_identifier) {
      throw createError('Panel identifier is required', 400)
    }

    const drawing = await Drawing.findByPk(id)
    if (!drawing) {
      throw createError('Drawing not found', 404)
    }

    const panel = await DrawingPanel.create({
      drawing_id: Number(id),
      panel_identifier,
      coordinates_json: JSON.stringify(coordinates_json),
      panel_type,
      length,
      width,
      design_depth,
      top_rl,
      bottom_rl,
      reinforcement_ton,
      no_of_anchors,
      anchor_length,
      anchor_capacity,
      concrete_design_qty,
      grabbing_qty,
      stop_end_area,
      guide_wall_rm,
      ramming_qty,
      created_by: req.user!.id,
    })

    res.status(201).json({
      success: true,
      message: 'Panel marked successfully',
      panel,
    })
  } catch (error) {
    next(error)
  }
}

export const bulkCreatePanels = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params // drawing_id
    const { panels } = req.body

    if (!panels || !Array.isArray(panels)) {
      throw createError('Panels array is required', 400)
    }

    const drawing = await Drawing.findByPk(id)
    if (!drawing) {
      throw createError('Drawing not found', 404)
    }

    const createdPanels = await DrawingPanel.bulkCreate(
      panels.map(p => ({
        drawing_id: Number(id),
        panel_identifier: p.panel_identifier,
        panel_type: p.panel_type || 'Primary',
        coordinates_json: JSON.stringify(p.dimensions || {}),
        length: p.length || p.dimensions?.length,
        width: p.width || p.dimensions?.width,
        design_depth: p.depth || p.dimensions?.depth, // Mapping 'depth' to 'design_depth'
        top_rl: p.top_rl,
        bottom_rl: p.bottom_rl,
        reinforcement_ton: p.reinforcement_ton,
        no_of_anchors: p.no_of_anchors,
        anchor_length: p.anchor_length,
        anchor_capacity: p.anchor_capacity,
        concrete_design_qty: p.concrete_design_qty,
        grabbing_qty: p.grabbing_qty,
        stop_end_area: p.stop_end_area,
        guide_wall_rm: p.guide_wall_rm,
        ramming_qty: p.ramming_qty,
        created_by: req.user!.id
      }))
    )

    res.status(201).json({
      success: true,
      message: `${createdPanels.length} panels created successfully`,
      count: createdPanels.length
    })
  } catch (error) {
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
  try {
    const { panelId } = req.params
    const {
      panel_identifier, panel_type,
      length, width, design_depth, top_rl, bottom_rl,
      reinforcement_ton, no_of_anchors, anchor_length, anchor_capacity,
      concrete_design_qty, grabbing_qty, stop_end_area, guide_wall_rm, ramming_qty
    } = req.body

    const panel = await DrawingPanel.findByPk(panelId, {
      include: [
        { association: 'dprRecords', required: false },
        { association: 'consumptions', required: false }
      ]
    })
    if (!panel) {
      throw createError('Panel not found', 404)
    }

    // Safety check: block edits if DPR or consumption records exist
    const panelData = panel as any
    const hasDPR = panelData.dprRecords && panelData.dprRecords.length > 0
    const hasCons = panelData.consumptions && panelData.consumptions.length > 0
    if (hasDPR || hasCons) {
      throw createError('Cannot edit panel: DPR or material consumption records already exist for this panel.', 400)
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
      length,
      width,
      design_depth,
      top_rl,
      bottom_rl,
      reinforcement_ton,
      no_of_anchors,
      anchor_length,
      anchor_capacity,
      concrete_design_qty,
      grabbing_qty,
      stop_end_area,
      guide_wall_rm,
      ramming_qty,
      coordinates_json: updatedCoordinatesJson
    })

    res.json({
      success: true,
      message: 'Panel updated successfully',
      panel,
    })
  } catch (error) {
    next(error)
  }
}

export const bulkUpdatePanels = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { panelIds, updates } = req.body
    if (!panelIds || !Array.isArray(panelIds) || panelIds.length === 0) {
      throw createError('panelIds array is required', 400)
    }
    const panels = await DrawingPanel.findAll({
      where: { id: panelIds },
      include: [
        { association: 'dprRecords', required: false },
        { association: 'consumptions', required: false }
      ]
    })
    const blockedPanels: string[] = []
    for (const panel of panels) {
      const pd = panel as any
      if ((pd.dprRecords && pd.dprRecords.length > 0) || (pd.consumptions && pd.consumptions.length > 0)) {
        blockedPanels.push(pd.panel_identifier)
      }
    }
    if (blockedPanels.length > 0) {
      throw createError(`Cannot bulk edit - panels with DPR/consumption records: ${blockedPanels.join(', ')}`, 400)
    }
    const updatePayload: any = {}
    const allowedFields = ['panel_type', 'length', 'width', 'design_depth', 'top_rl', 'bottom_rl', 'reinforcement_ton', 'no_of_anchors', 'anchor_length', 'anchor_capacity', 'concrete_design_qty', 'grabbing_qty', 'stop_end_area', 'guide_wall_rm', 'ramming_qty']
    for (const field of allowedFields) {
      if (updates[field] !== undefined && updates[field] !== null && updates[field] !== '') {
        updatePayload[field] = updates[field]
      }
    }
    if (Object.keys(updatePayload).length === 0) {
      throw createError('No valid fields to update', 400)
    }

    // Update each panel sequentially to merge their coordinates_json properly
    for (const panel of panels) {
      let updatedCoordinatesJson = panel.coordinates_json;
      if (updatePayload.length !== undefined || updatePayload.width !== undefined || updatePayload.design_depth !== undefined) {
        try {
          const existingDims = typeof panel.coordinates_json === 'string'
            ? JSON.parse(panel.coordinates_json)
            : (panel.coordinates_json || {});

          const newDims = { ...existingDims };
          if (updatePayload.length !== undefined) newDims.length = updatePayload.length;
          if (updatePayload.width !== undefined) newDims.width = updatePayload.width;
          if (updatePayload.design_depth !== undefined) {
            newDims.depth = updatePayload.design_depth;
            newDims.height = updatePayload.design_depth; // Keep height in sync
          }

          updatedCoordinatesJson = JSON.stringify(newDims);
        } catch (e) { }
      }

      await panel.update({
        ...updatePayload,
        ...(updatedCoordinatesJson !== panel.coordinates_json ? { coordinates_json: updatedCoordinatesJson } : {})
      });
    }

    res.json({ success: true, message: `${panels.length} panels updated successfully`, count: panels.length })
  } catch (error) {
    next(error)
  }
}
export const deletePanel = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { panelId } = req.params
    const panel = await DrawingPanel.findByPk(panelId, {
      include: [
        { association: 'dprRecords', required: false },
        { association: 'consumptions', required: false }
      ]
    })
    if (!panel) {
      throw createError('Panel not found', 404)
    }
    const pd = panel as any
    if ((pd.dprRecords && pd.dprRecords.length > 0) || (pd.consumptions && pd.consumptions.length > 0)) {
      throw createError('Cannot delete panel: DPR or material consumption records already exist for this panel.', 400)
    }
    await panel.destroy()
    res.json({ success: true, message: 'Panel deleted successfully' })
  } catch (error) {
    next(error)
  }
}