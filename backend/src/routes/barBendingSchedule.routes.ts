import { Router } from 'express'
import {
  createBarBendingSchedule,
  getBarBendingSchedules,
  getBarBendingSchedule,
  updateBarBendingSchedule,
  getBarBendingSchedulesByProject,
  getDrawingPanelsForProject,
} from '../controllers/barBendingSchedule.controller'
import { authenticate } from '../middleware/auth.middleware'
import { hasPermission } from '../middleware/rbac.middleware'

const router = Router()

router.use(authenticate)

router.get('/', hasPermission('dpr.read'), getBarBendingSchedules)
router.post('/', hasPermission('dpr.create'), createBarBendingSchedule)
router.get('/project/:projectId', hasPermission('dpr.read'), getBarBendingSchedulesByProject)
router.get('/project/:projectId/panels', hasPermission('dpr.read'), getDrawingPanelsForProject)
router.get('/:id', hasPermission('dpr.read'), getBarBendingSchedule)
router.put('/:id', hasPermission('dpr.update'), updateBarBendingSchedule)

export default router

