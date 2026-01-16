import { Router } from 'express'
import {
  createQuotation,
  getQuotations,
  getQuotation,
  updateQuotation,
  getQuotationsByLead,
  downloadPdf
} from '../controllers/quotation.controller'
import { authenticate } from '../middleware/auth.middleware'
import { hasPermission } from '../middleware/rbac.middleware'

const router = Router()

router.use(authenticate)

router.get('/', hasPermission('quotations.read'), getQuotations)
router.post('/', hasPermission('quotations.create'), createQuotation)
router.get('/lead/:leadId', hasPermission('quotations.read'), getQuotationsByLead)
router.get('/:id/pdf', hasPermission('quotations.read'), downloadPdf)
router.get('/:id', hasPermission('quotations.read'), getQuotation)
router.put('/:id', hasPermission('quotations.update'), updateQuotation)

export default router

