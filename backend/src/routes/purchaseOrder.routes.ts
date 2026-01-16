import { Router } from 'express'
import {
    createPurchaseOrder,
    approvePurchaseOrder,
    rejectPurchaseOrder,
    getPurchaseOrders
} from '../controllers/purchaseOrder.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/', getPurchaseOrders)
router.post('/', createPurchaseOrder)
router.post('/:id/approve', approvePurchaseOrder)
router.post('/:id/reject', rejectPurchaseOrder)

export default router
