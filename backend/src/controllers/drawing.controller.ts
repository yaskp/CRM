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
    const { panel_identifier, coordinates_json, panel_type } = req.body

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

