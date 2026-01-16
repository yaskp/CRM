import { Router } from 'express'
import * as roleController from '../controllers/role.controller'
import { authenticate, authorize } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)
router.use(authorize(['Admin']))

router.get('/permissions', roleController.getPermissions) // Must be before /:id
router.get('/', roleController.getRoles)
router.get('/:id', roleController.getRole)
router.post('/', roleController.createRole)
router.put('/:id', roleController.updateRole)
router.delete('/:id', roleController.deleteRole)

export default router
