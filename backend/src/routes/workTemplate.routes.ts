
import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { getWorkTemplates, getWorkTemplate, createWorkTemplate, updateWorkTemplate } from '../controllers/workTemplate.controller'

const router = Router()

router.get('/', authenticate, getWorkTemplates)
router.get('/:id', authenticate, getWorkTemplate)
router.post('/', authenticate, createWorkTemplate)
router.put('/:id', authenticate, updateWorkTemplate)

export default router
