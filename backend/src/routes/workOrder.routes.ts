import { Router } from 'express'
import {
  createWorkOrder,
  getWorkOrders,
  getWorkOrder,
  updateWorkOrder,
  addWorkOrderItem,
  deleteWorkOrderItem,
  downloadWorkOrderPDF,
  uploadSignedWorkOrder,
} from '../controllers/workOrder.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/', getWorkOrders)
router.post('/', createWorkOrder)
router.get('/:id', getWorkOrder)
router.get('/:id/pdf', downloadWorkOrderPDF)
router.put('/:id', updateWorkOrder)
router.post('/:id/items', addWorkOrderItem)
router.delete('/:id/items/:itemId', deleteWorkOrderItem)
router.post('/:id/upload-signed', uploadSignedWorkOrder)

export default router

