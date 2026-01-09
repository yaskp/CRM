import { Router } from 'express'
import {
  createWorkOrder,
  getWorkOrders,
  getWorkOrder,
  updateWorkOrder,
  addWorkOrderItem,
  deleteWorkOrderItem,
} from '../controllers/workOrder.controller'
import { authenticate } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/', getWorkOrders)
router.post('/', createWorkOrder)
router.get('/:id', getWorkOrder)
router.put('/:id', updateWorkOrder)
router.post('/:id/items', addWorkOrderItem)
router.delete('/:id/items/:itemId', deleteWorkOrderItem)

export default router

