
import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import {
    getAllUnits,
    createUnit,
    updateUnit,
    deleteUnit,
    importUnits
} from '../controllers/unit.controller'

const router = Router()

router.use(authenticate)

router.get('/', getAllUnits)
router.post('/', createUnit)
router.post('/import', importUnits)
router.put('/:id', updateUnit)
router.delete('/:id', deleteUnit)

export default router
