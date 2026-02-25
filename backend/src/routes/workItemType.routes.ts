
import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import {
    getAllWorkItemTypes,
    createWorkItemType,
    updateWorkItemType,
    deleteWorkItemType,
    importWorkItemTypes
} from '../controllers/workItemType.controller'

const router = Router()

router.use(authenticate)

router.get('/', getAllWorkItemTypes)
router.post('/', createWorkItemType)
router.post('/import', importWorkItemTypes)
router.put('/:id', updateWorkItemType)
router.delete('/:id', deleteWorkItemType)

export default router
