import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { createError } from '../middleware/errorHandler'

export const uploadFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.file) {
            throw createError('No file uploaded', 400)
        }

        // Construct public URL (assuming static file serving is set up)
        // The path stored in req.file.path is system dependent (e.g., uploads\common\file.jpg)
        // We need to convert it to a web-friendly URL
        const folder = req.query.folder ? String(req.query.folder) : 'common'
        const fileName = req.file.filename
        const fileUrl = `/uploads/${folder}/${fileName}`

        res.status(201).json({
            success: true,
            message: 'File uploaded successfully',
            file: {
                filename: fileName,
                path: req.file.path,
                url: fileUrl,
                mimetype: req.file.mimetype,
                size: req.file.size
            }
        })
    } catch (error) {
        next(error)
    }
}
