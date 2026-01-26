import { Router } from 'express'
import {
  uploadDrawing,
  getDrawings,
  getDrawing,
  markPanel,
  bulkCreatePanels,
  getPanels,
  updatePanelProgress,
} from '../controllers/drawing.controller'
import { authenticate } from '../middleware/auth.middleware'
import { hasPermission } from '../middleware/rbac.middleware'

const router = Router()

router.use(authenticate)

router.get('/', getDrawings)
router.post('/', hasPermission('projects.update'), uploadDrawing as any)
router.get('/:id', getDrawing)
router.post('/:id/panels', hasPermission('projects.update'), markPanel)
router.post('/:id/panels/bulk', hasPermission('projects.update'), bulkCreatePanels)
router.get('/:id/panels', getPanels)
router.put('/panels/:panelId/progress', hasPermission('projects.update'), updatePanelProgress)

export default router

