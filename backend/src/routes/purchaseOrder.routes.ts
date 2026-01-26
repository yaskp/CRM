import { Router } from 'express'
import {
    createPurchaseOrder,
    approvePurchaseOrder,
    rejectPurchaseOrder,
    getPurchaseOrders,
    getPurchaseOrderById,
    downloadPurchaseOrderPDF,
    updatePurchaseOrder
} from '../controllers/purchaseOrder.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/', getPurchaseOrders)
router.post('/', createPurchaseOrder)
router.put('/:id', updatePurchaseOrder)
router.post('/:id/approve', approvePurchaseOrder)
router.post('/:id/reject', rejectPurchaseOrder)
router.get('/:id/pdf', downloadPurchaseOrderPDF)
router.get('/:id', getPurchaseOrderById)

export default router
