import { Router } from 'express'
import {
  createDPR,
  getDPRs,
  getDPR,
  updateDPR,
  getDPRsByProject,
} from '../controllers/dpr.controller'
import { authenticate } from '../middleware/auth.middleware'
import { hasPermission } from '../middleware/rbac.middleware'

const router = Router()

router.use(authenticate)

router.get('/', hasPermission('dpr.read'), getDPRs)
router.post('/', hasPermission('dpr.create'), createDPR)
router.get('/project/:projectId', hasPermission('dpr.read'), getDPRsByProject)
router.get('/:id', hasPermission('dpr.read'), getDPR)
router.put('/:id', hasPermission('dpr.update'), updateDPR)

export default router

