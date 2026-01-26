import { Router } from 'express'
import * as boqController from '../controllers/boq.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.post('/', boqController.createBOQ)
router.get('/project/:project_id', boqController.getProjectBOQs)
router.get('/:id', boqController.getBOQDetails)
router.post('/:id/approve', boqController.approveBOQ)
router.post('/project/:project_id/sync', boqController.syncBOQFromQuotation)

export default router
