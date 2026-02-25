import { Router } from 'express'
import { annexureController } from '../controllers/annexureController'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/', annexureController.getAnnexures)
router.get('/:id', annexureController.getAnnexure)
router.post('/import', annexureController.importAnnexures)
router.post('/', annexureController.createAnnexure)
router.put('/:id', annexureController.updateAnnexure)
router.delete('/:id', annexureController.deleteAnnexure)

export default router
