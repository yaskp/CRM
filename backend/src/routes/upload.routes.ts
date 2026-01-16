import { Router } from 'express'
import { uploadFile } from '../controllers/upload.controller'
import { authenticate } from '../middleware/auth.middleware'
import { upload } from '../middleware/upload.middleware'

const router = Router()

router.use(authenticate)

// Route: POST /api/upload?folder=leads
// Key: 'file' (form-data)
router.post('/', upload.single('file'), uploadFile)

export default router
