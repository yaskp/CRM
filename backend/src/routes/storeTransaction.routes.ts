import { Router } from 'express'
import {
  createGRN,
  createSTN,
  createSRN,
  getTransactions,
  getTransaction,
  approveTransaction,
  rejectTransaction,
} from '../controllers/storeTransaction.controller'
import { authenticate } from '../middleware/auth.middleware'
import { hasPermission } from '../middleware/rbac.middleware'

const router = Router()

router.use(authenticate)

router.get('/', hasPermission('store.read'), getTransactions)
router.post('/grn', hasPermission('store.create'), createGRN)
router.post('/stn', hasPermission('store.create'), createSTN)
router.post('/srn', hasPermission('store.create'), createSRN)
router.get('/:id', hasPermission('store.read'), getTransaction)
router.put('/:id/approve', hasPermission('store.approve'), approveTransaction)
router.put('/:id/reject', hasPermission('store.approve'), rejectTransaction)

export default router

