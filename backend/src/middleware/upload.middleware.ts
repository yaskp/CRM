import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { createError } from './errorHandler'

// Ensure uploads directory exists
const uploadDir = 'uploads'
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir)
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Dynamic destination based on query param or default
        const folder = req.query.folder ? String(req.query.folder) : 'common'
        const dest = path.join(uploadDir, folder)

        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true })
        }

        cb(null, dest)
    },
    filename: (req, file, cb) => {
        // Sanitize filename and append unique suffix
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
        const ext = path.extname(file.originalname)
        cb(null, file.fieldname + '-' + uniqueSuffix + ext)
    }
})

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Allow mostly all document and image types
    const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true)
    } else {
        cb(new Error('Invalid file type. Only images and documents are allowed.'))
    }
}

export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: fileFilter
})
