import { Router } from 'express'
import {
  createVendor,
  getVendors,
  getVendor,
  updateVendor,
  deleteVendor,
  assignVendorToProject,
  getProjectVendors,
  updateProjectVendor,
  removeVendorFromProject,
} from '../controllers/vendor.controller'
import { authenticate } from '../middleware/auth.middleware'
import { hasPermission } from '../middleware/rbac.middleware'

const router = Router()

router.use(authenticate)

router.get('/', getVendors)
router.post('/', hasPermission('projects.update'), createVendor)
router.get('/:id', getVendor)
router.put('/:id', hasPermission('projects.update'), updateVendor)
router.delete('/:id', hasPermission('projects.delete'), deleteVendor)
router.post('/:id/assign-project', hasPermission('projects.update'), assignVendorToProject)
router.get('/project/:projectId', getProjectVendors)
router.put('/project/:id', updateProjectVendor)
router.delete('/project/:id', removeVendorFromProject)

export default router
