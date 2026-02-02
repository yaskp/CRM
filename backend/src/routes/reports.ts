
import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { getProjectConsumptionReport } from '../controllers/reports.controller'
import { getVendorAgingReport } from '../controllers/financeReport.controller'

const router = Router()

router.get('/project-consumption', authenticate, getProjectConsumptionReport)
router.get('/finance/vendor-aging', authenticate, getVendorAgingReport)

export default router
