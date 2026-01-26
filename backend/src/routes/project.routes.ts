import { Router } from 'express'
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  updateProjectStatus,
  createProjectFromQuotation,
} from '../controllers/project.controller'
import { authenticate } from '../middleware/auth.middleware'
import { hasPermission } from '../middleware/rbac.middleware'

const router = Router()

router.use(authenticate)

router.get('/', hasPermission('projects.read'), getProjects)
router.post('/', hasPermission('projects.create'), createProject)
router.post('/from-quotation/:quotationId', hasPermission('projects.create'), createProjectFromQuotation)
router.get('/:id', hasPermission('projects.read'), getProject)
router.put('/:id', hasPermission('projects.update'), updateProject)
router.delete('/:id', hasPermission('projects.delete'), deleteProject)
router.put('/:id/status', hasPermission('projects.update'), updateProjectStatus)

export default router

