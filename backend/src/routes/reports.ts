
import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { getProjectConsumptionReport } from '../controllers/reports.controller'

const router = Router()

router.get('/project-consumption', authenticate, getProjectConsumptionReport)

export default router
