import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { hasPermission } from '../middleware/rbac.middleware'
import {
    getRequisitions,
    getRequisition,
    createRequisition,
    updateRequisition,
    approveRequisition,
    cancelRequisition,
} from '../controllers/materialRequisition.controller'

const router = Router()

// All routes require authentication
router.use(authenticate)

// Material requisition routes
router.get('/', hasPermission('requisitions.read'), getRequisitions)
router.get('/:id', hasPermission('requisitions.read'), getRequisition)
router.post('/', hasPermission('requisitions.create'), createRequisition)
router.put('/:id', hasPermission('requisitions.update'), updateRequisition)
router.post('/:id/approve', hasPermission('requisitions.approve'), approveRequisition)
router.post('/:id/cancel', hasPermission('requisitions.update'), cancelRequisition)

export default router
