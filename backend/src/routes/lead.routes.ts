import { Router } from 'express'
import {
  createLead,
  getLeads,
  getLead,
  updateLead,
  convertLeadToProject,
} from '../controllers/lead.controller'
import { authenticate } from '../middleware/auth.middleware'
import { hasPermission } from '../middleware/rbac.middleware'

const router = Router()

router.use(authenticate)

router.get('/', hasPermission('leads.read'), getLeads)
router.post('/', hasPermission('leads.create'), createLead)
router.get('/:id', hasPermission('leads.read'), getLead)
router.put('/:id', hasPermission('leads.update'), updateLead)
router.post('/:id/convert', hasPermission('leads.update'), convertLeadToProject)

export default router

